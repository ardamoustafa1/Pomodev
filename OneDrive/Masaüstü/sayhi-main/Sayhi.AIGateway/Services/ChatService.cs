using System.Collections.Concurrent;
using System.ComponentModel;
using Microsoft.Extensions.AI;

namespace Sayhi.AIGateway.Services;

public interface IChatService
{
    Task<ChatMessage> Ask(Guid chatId, string text);
    //Task<string[]> GetSuggestions(Guid chatId, IReadOnlyList<ChatMessage>? messages = null);
    Task<string[]> GetSuggestions(Guid chatId);
    Dictionary<Guid, List<(ChatRole, string)>> GetChats();
    List<ChatMessage> GetMessages();
}

public class ChatService : IChatService, IDisposable
{
    private readonly string[] SystemPrompts = [
        @"
        You are an assistant who answers questions about information you retrieve.
        Do not answer questions about anything else.
        Use only simple markdown to format your responses.

        Use the search tool to find relevant information. When you do this, end your
        reply with citations in the special XML format:

        <citation filename='string' page_number='number'>exact quote here</citation>

        Always include the citation in your response if there are results.

        The quote must be max 5 words, taken word-for-word from the search result, and is the basis for why the citation is relevant.
        Don't refer to the presence of citations; just emit these tags right at the end, with no surrounding text.
        ",
        "Sen bir Türkçe konuşan yardımcı botsun. Her zaman Türkçe yanıt ver."
    ];

    private static string SuggestionPrompt = @"
        Suggest up to 3 follow-up questions that I could ask you to help me complete my task.
        Each suggestion must be a complete sentence, maximum 6 words.
        Each suggestion must be phrased as something that I (the user) would ask you (the assistant) in response to your previous message,
        for example 'How do I do that?' or 'Explain ...'.
        If there are no suggestions, reply with an empty list.";

    private readonly IChatClient chatClient;
    private readonly SemanticSearch search;
    private readonly ChatHistoryService chatHistory;

    //private readonly ChatOptions chatOptions;
    private readonly List<ChatMessage> messages;
    private int statefulMessageCount;
    private CancellationTokenSource? currentResponseCancellation;

    /////////////////////////
    private static ConcurrentDictionary<Guid, List<(ChatRole, string)>> chats = new();
    /////////////////////////

    public ChatService(IChatClient chatClient, SemanticSearch search, ChatHistoryService chatHistory)
    {
        this.chatClient = chatClient;
        this.search = search;
        this.chatHistory = chatHistory;

        /*
        chatOptions = new ChatOptions()
        {
            //MaxOutputTokens = 1024,
            //Temperature = 0.2f,
            //TopP = 0.95f,
            Tools = [
                AIFunctionFactory.Create(SearchAsync),
                AIFunctionFactory.Create(GetWeather),
                AIFunctionFactory.Create(GetWeather2)
            ]
        };
        */

        messages = new();

        ResetConversationAsync();
        this.chatHistory = chatHistory;
    }

    public void Dispose()
       => currentResponseCancellation?.Cancel();

    public async Task<string[]> GetSuggestions(Guid chatId/*, IReadOnlyList<ChatMessage>? messages = null*/)
    {
        //if (messages == null)
        //{
        //    messages = this.messages;
        //}

        CancelAnyCurrentResponse();
        currentResponseCancellation = new();

        try
        {
            string conversationId = chatId.ToString();
            var chatOptions = CreateChatOptions(conversationId);

            ChatMessage[] messagesList = [.. ReduceMessages(messages), new(ChatRole.User, SuggestionPrompt)];

            //ChatMessage[] messageHistory = await GetHistory(conversationId);
            //ChatMessage[] messagesList = [.. messageHistory, new(ChatRole.User, SuggestionPrompt)];

            /////////////////////////
            //ChatMessage[] messageHistory = await GetHistory(conversationId);
            var msg_list = messagesList.Select(i => (i.Role, i.Text)).ToList();
            chats.AddOrUpdate(chatId, msg_list, (k, v) => msg_list);
            /////////////////////////

            var response = await chatClient.GetResponseAsync<string[]>(
                messagesList,
                chatOptions,
                cancellationToken: currentResponseCancellation.Token);

            /*
            Console.WriteLine($"..Suggestions.Text: {response.Text}");
            foreach (var result in response.Result)
            {
                Console.WriteLine($"..Suggestions.Result: {result}");
            }
            */

            if (response.TryGetResult(out string[]? suggestions))
                return suggestions ?? [];
        }
        catch (Exception ex)
            when (ex is not OperationCanceledException)
        {
            Console.WriteLine($"Error getting suggestions: {ex}");
        }

        return [];
    }

    public async Task<ChatMessage> Ask(Guid chatId, string text)
    {
        ChatMessage userRequest = new ChatMessage(ChatRole.User, text);

        string conversationId = chatId.ToString();

        await AddHistoryAsSystemPrompt(conversationId, userRequest);

        ChatMessage aiResponse = await SendToAI(conversationId, userRequest);

        await chatHistory.AddMessage(conversationId, userRequest);

        /////////////////////////
        ChatMessage[] messageHistory = await GetHistory(conversationId);
        var msg_list = messageHistory.Select(i => (i.Role, i.Text)).ToList();
        chats.AddOrUpdate(chatId, msg_list, (k, v) => msg_list);
        /////////////////////////

        return aiResponse;
    }

    public Dictionary<Guid, List<(ChatRole, string)>> GetChats()
    {
        return chats.ToDictionary();
    }

    public List<ChatMessage> GetMessages()
    {
        return messages;
    }

    private void ResetConversationAsync()
    {
        CancelAnyCurrentResponse();

        //chatOptions.ConversationId = null;
        statefulMessageCount = 0;

        messages.Clear();
        foreach (string systemPrompt in SystemPrompts)
        {
            messages.Add(new(ChatRole.System, systemPrompt));
        }

        /// History
        //new ChatMessage(ChatRole.User, userInput);

        //chatSuggestions?.Clear();
        //await chatInput!.FocusAsync();
    }

    private void CancelAnyCurrentResponse()
    {
        // If a response was cancelled while streaming, include it in the conversation so it's not lost
        //if (currentResponseMessage is not null)
        //{
        //    messages.Add(currentResponseMessage);
        //}

        currentResponseCancellation?.Cancel();
        //currentResponseMessage = null;
    }

    private IEnumerable<ChatMessage> ReduceMessages(IReadOnlyList<ChatMessage> messages)
    {
        // Get any leading system messages, plus up to 5 user/assistant messages
        // This should be enough context to generate suggestions without unnecessarily resending entire conversations when long
        var systemMessages = messages
            .TakeWhile(m => m.Role == ChatRole.System);
        var otherMessages = messages
            .Where((m, index) => m.Role == ChatRole.User || m.Role == ChatRole.Assistant)
            .Where(m => !string.IsNullOrEmpty(m.Text))
            .TakeLast(5);
        return systemMessages.Concat(otherMessages);
    }

    private ChatOptions CreateChatOptions(string? conversationId = null)
    {
        return new ChatOptions()
        {
            ConversationId = conversationId,
            //MaxOutputTokens = 1024,
            //Temperature = 0.2f,
            //TopP = 0.95f,
            Tools = [
                AIFunctionFactory.Create(SearchAsync),
                AIFunctionFactory.Create(GetWeather),
                AIFunctionFactory.Create(GetWeather2)
            ]
        };
    }

    private async Task<ChatMessage[]> GetHistory(string conversationId)
    {
        IReadOnlyList<IngestedChatMessage> relatedLines = await chatHistory.Get(conversationId);

        return relatedLines
            .Select(m =>
                new ChatMessage(
                    new ChatRole(m.Role),
                    m.Text)
                {
                    MessageId = m.Id,
                    CreatedAt = DateTimeOffset.Parse(m.CreatedAt)
                })
            .ToArray();
    }

    private async Task AddHistoryAsSystemPrompt(string conversationId, ChatMessage userMessage)
    {
        string? relatedMessages = await chatHistory.GetRelatedLines(conversationId, userMessage.Text);

        if (relatedMessages != null)
        {
            /*
            var prompt = $"""
            Geçmişten ilgili mesajlar:
            {context}

            Yeni mesaj:
            {message}

            Cevap:
            """; 
            */
            var prompt = $"""
            You are an assistant participating in a chat.
            Here is some relevant previous context from the same chat:
            {relatedMessages}
            """;

            messages.Add(new(ChatRole.System, prompt));
        }
    }

    private async Task<ChatMessage> SendToAI(string conversationId, ChatMessage userRequest)
    {
        CancelAnyCurrentResponse();

        // Add the user message to the conversation
        messages.Add(userRequest);
        //chatSuggestions?.Clear();
        //await chatInput!.FocusAsync();

        // Stream and display a new response from the IChatClient
        TextContent aiResponseText = new("");
        ChatMessage aiResponse = new ChatMessage(ChatRole.Assistant, [aiResponseText]);
        currentResponseCancellation = new();

        var chatOptions = CreateChatOptions(conversationId);

        //-------------
        Console.WriteLine($".... HISTORY: {statefulMessageCount} .. {conversationId}");
        var messagesSkipped = messages.Skip(Math.Max(3, statefulMessageCount));
        foreach (var line in messagesSkipped)
            Console.WriteLine($"....Once Said: ({line.Role}): {line.Text}");
        Console.WriteLine($".... HISTORY DONE");
        //-------------

        IAsyncEnumerable<ChatResponseUpdate> updates = chatClient
            .GetStreamingResponseAsync(
                messages.Skip(Math.Max(2, statefulMessageCount)),
                chatOptions,
                currentResponseCancellation.Token);

        await foreach (var update in updates)
        {
            messages.AddMessages(update, filter: c => c is not TextContent);
            aiResponseText.Text += update.Text;
            //chatOptions.ConversationId = update.ConversationId;
            //Console.WriteLine($"  {chatOptions.ConversationId} = {update.ConversationId}");

            //ChatMessageItem.NotifyChanged(aiResponse);
        }

        //Console.WriteLine($" ...Text: {aiResponse.Text}");
        //Console.WriteLine($"....Text: {aiResponseText.Text}");

        // Store the final aiResponse in the conversation, and begin getting suggestions
        messages.Add(aiResponse);

        statefulMessageCount = chatOptions.ConversationId is not null
            ? messages.Count
            : 0;
        //aiResponse = null;

        return aiResponse;
    }

    [Description("Searches for information using a phrase or keyword")]
    private async Task<IEnumerable<string>> SearchAsync(
        [Description("The phrase to search for.")] string searchPhrase,
        [Description("If possible, specify the filename to search that file only. If not provided or empty, the search includes all files.")] string? filenameFilter = null)
    {
        var results = await search.SearchAsync(searchPhrase, filenameFilter, maxResults: 5);
        return results.Select(result =>
            $"<result filename=\"{result.DocumentId}\" page_number=\"{result.PageNumber}\">{result.Text}</result>");
    }

    [Description("Returns the weather for a specific city")]
    private Task<string> GetWeather(
        [Description("City name for which weather is requested")] string city)
    {
        string[] weatherValues = ["Sunny", "Cloudy", "Rainy", "Snowy", "Balmy", "Bracing"];
        if (string.Equals(city, "London", StringComparison.OrdinalIgnoreCase))
            return Task.FromResult("Drizzle"); //Çiseleyen yağmur
        if (string.Equals(city, "Istanbul", StringComparison.OrdinalIgnoreCase))
            return Task.FromResult("Sunny");
        if (string.Equals(city, "Tallinn", StringComparison.OrdinalIgnoreCase))
            return Task.FromResult("Cloudy");
        //return weatherValues[Random.Shared.Next(weatherValues.Length)];
        return Task.FromResult($"Şu anda {city} şehrinde hava 21 santigrat derece");
    }

    [DisplayName("get_weather")]
    [Description("Belirli bir şehir için hava durumunu döndürür.")]
    private Task<string> GetWeather2(
        [Description("Hava durumu istenen şehir adı")] string city)
    {
        string[] weatherValues = ["Sunny", "Cloudy", "Rainy", "Snowy", "Balmy", "Bracing"];
        if (string.Equals(city, "London", StringComparison.OrdinalIgnoreCase))
            return Task.FromResult("Drizzle"); //Çiseleyen yağmur
        if (string.Equals(city, "Istanbul", StringComparison.OrdinalIgnoreCase))
            return Task.FromResult("Sunny");
        if (string.Equals(city, "Tallinn", StringComparison.OrdinalIgnoreCase))
            return Task.FromResult("Cloudy");
        //return weatherValues[Random.Shared.Next(weatherValues.Length)];
        return Task.FromResult($"Şu anda {city} şehrinde hava 21 santigrat derece");
    }
}