using Microsoft.Extensions.AI;
using Microsoft.Extensions.VectorData;

namespace Sayhi.AIGateway.Services.Ingestion;

public class ChatHistoryIngestor(
    VectorStoreCollection<string, IngestedChatConversation> vectorCollectionChat,
    VectorStoreCollection<string, IngestedChatMessage> vectorCollectionChatMessage,
    ILogger<ChatHistoryIngestor> logger)
{
    public static async Task UseChatHistory(IServiceProvider services)
    {
        using var scope = services.CreateScope();
        var ingestor = scope.ServiceProvider.GetRequiredService<ChatHistoryIngestor>();
        await ingestor.UseChatHistory();
    }

    public async Task UseChatHistory()
    {
        await vectorCollectionChatMessage.EnsureCollectionExistsAsync();
        await vectorCollectionChat.EnsureCollectionExistsAsync();
    }

    public async Task AddChatConversation(string conversationId, ChatMessage message)
    {
        IngestedChatConversation? ingestedChatConversation = await vectorCollectionChat
            .GetAsync(s => s.Id == conversationId, int.MaxValue)
            .SingleOrDefaultAsync();

        if (ingestedChatConversation == null)
        {
            ingestedChatConversation = new()
            {
                Id = conversationId, //Guid.CreateVersion7().ToString(),
                Title = null,
                CreatedAt = DateTimeOffset.UtcNow.ToString("o")
            };

            await vectorCollectionChat.UpsertAsync(ingestedChatConversation);
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

    public async Task DeleteChatConversation(string conversationId)
    {
        await vectorCollectionChat.DeleteAsync(conversationId);

        List<IngestedChatMessage> messagesToDelete = await vectorCollectionChatMessage
            .GetAsync(s => s.ConversationId == conversationId, int.MaxValue)
            .ToListAsync();

        string[] messageIdsToDelete = messagesToDelete.Select(m => m.Id).ToArray();

        if (messageIdsToDelete.Length > 0)
        {
            await vectorCollectionChatMessage.DeleteAsync(messageIdsToDelete);
        }
    }

    /*
    private async Task<IngestedChatConversation?> GetChat(string conversationId)
    {
        return await vectorCollectionChat
            .GetAsync(s => s.Id == conversationId, int.MaxValue)
            .SingleOrDefaultAsync();
    }

    private async Task<List<IngestedChatMessage>> GetChatMessages(string conversationId)
    {
        return await vectorCollectionChatMessage
            .GetAsync(s => s.ConversationId == conversationId, int.MaxValue)
            .ToListAsync();
    }
    */
}