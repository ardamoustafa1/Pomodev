using Microsoft.Extensions.AI;
using Microsoft.Extensions.VectorData;

namespace Sayhi.AIGateway.Services;

public class ChatHistoryService(
    VectorStoreCollection<string, IngestedChatConversation> vectorCollectionChat,
    VectorStoreCollection<string, IngestedChatMessage> vectorCollectionChatMessage
    //IEmbeddingGenerator<string, Embedding<float>> embeddingGenerator)
    //[FromKeyedServices("historyEmbed")] IEmbeddingGenerator<string, Embedding<float>> embeddingGenerator)
    )
{
    private const int Max = 4096;

    public static async Task UseChatHistory(IServiceProvider services, CancellationToken cancellationToken = default)
    {
        using var scope = services.CreateScope();
        var chatHistoryService = scope.ServiceProvider.GetRequiredService<ChatHistoryService>();
        await chatHistoryService.EnsureCollections(cancellationToken);
    }

    public async Task EnsureCollections(CancellationToken cancellationToken = default)
    {
        await vectorCollectionChatMessage.EnsureCollectionExistsAsync(cancellationToken);
        await vectorCollectionChat.EnsureCollectionExistsAsync(cancellationToken);
    }

    /*
    public async Task AddMessage(string conversationId, string text)
    {

        //var embedding = await embeddingGenerator.GenerateEmbeddingAsync(text);
        var embedding = await embeddingGenerator.GenerateVectorAsync(text);
        var record = new IngestedChatConversation
        {
            Id = conversationId,
            Content = text,
            Embedding = embedding
        };

        await vectorCollection.UpsertAsync(record);
    }
    */

    public async Task<IReadOnlyList<IngestedChatMessage>> Get(string conversationId, int? maxResults = null, CancellationToken cancellationToken = default)
    {
        return await vectorCollectionChatMessage
            .GetAsync(i => i.ConversationId == conversationId, maxResults ?? Max, cancellationToken: cancellationToken)
            .ToListAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<IngestedChatMessage>> SearchChatMessage(string text, string? conversationId, int? maxResults = null, CancellationToken cancellationToken = default)
    {
        var nearest = vectorCollectionChatMessage
            .SearchAsync(text, maxResults ?? Max, new VectorSearchOptions<IngestedChatMessage>()
            {
                Filter = conversationId is { Length: > 0 } ? record => record.ConversationId == conversationId : null,
            }, cancellationToken);

        return await nearest.Select(result => result.Record).ToListAsync(cancellationToken);
    }

    public async Task<string?> GetRelatedLines(string conversationId, string text, int? maxResults = null, CancellationToken cancellationToken = default)
    {
        /*
        IngestedChatConversation? ingestedChatConversation = await vectorCollectionChat
            .GetAsync(s => s.Id == conversationId, Max)
            .SingleOrDefaultAsync();

        if (ingestedChatConversation == null)
            return null;
        */

        IReadOnlyList<IngestedChatMessage> relatedLines = await SearchChatMessage(text, conversationId, maxResults, cancellationToken);

        return string.Join("\n", relatedLines.Select(x => x.Text));
    }

    public async Task AddMessage(string conversationId, ChatMessage message, CancellationToken cancellationToken = default)
    {
        IngestedChatConversation? ingestedChatConversation = await vectorCollectionChat
            .GetAsync(s => s.Id == conversationId, Max, cancellationToken: cancellationToken)
            .SingleOrDefaultAsync(cancellationToken);

        if (ingestedChatConversation == null)
        {
            ingestedChatConversation = new()
            {
                Id = conversationId, //Guid.CreateVersion7().ToString(),
                Title = null,
                CreatedAt = DateTimeOffset.UtcNow.ToString("o")
            };

            await vectorCollectionChat.UpsertAsync(ingestedChatConversation, cancellationToken);
        }

        IngestedChatMessage ingestedChatMessage = new()
        {
            Id = message.MessageId ?? Guid.CreateVersion7().ToString(),
            ConversationId = conversationId,
            Role = message.Role.Value,
            Text = message.Text,
            CreatedAt = (message.CreatedAt ?? DateTimeOffset.UtcNow).ToString("o")
        };

        await vectorCollectionChatMessage.UpsertAsync(ingestedChatMessage);
    }

    public async Task DeleteChat(string conversationId, CancellationToken cancellationToken = default)
    {
        await vectorCollectionChat.DeleteAsync(conversationId, cancellationToken);

        List<IngestedChatMessage> messagesToDelete = await vectorCollectionChatMessage
            .GetAsync(s => s.ConversationId == conversationId, Max, cancellationToken: cancellationToken)
            .ToListAsync(cancellationToken);

        string[] messageIdsToDelete = messagesToDelete.Select(m => m.Id).ToArray();

        if (messageIdsToDelete.Length > 0)
        {
            await vectorCollectionChatMessage.DeleteAsync(messageIdsToDelete, cancellationToken);
        }
    }
}
