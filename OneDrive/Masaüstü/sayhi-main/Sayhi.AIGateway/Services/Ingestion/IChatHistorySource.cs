namespace Sayhi.AIGateway.Services.Ingestion;

public interface IChatHistorySource
{
    /// <summary>
    /// Chat geçmişini temsil eden benzersiz kaynak kimliği (örneğin kullanıcı ID'si veya chat dizisi kimliği)
    /// </summary>
    string ConversationId { get; }

    /// <summary>
    /// Daha önce vektör veritabanında saklanan session’lara göre hangi oturumların silindiğini döner.
    /// </summary>
    Task<IEnumerable<IngestedChatConversation>> GetDeletedSessionsAsync(IEnumerable<IngestedChatConversation> existingSessions);

    /// <summary>
    /// Yeni veya değişmiş chat session’ları döner.
    /// </summary>
    Task<IEnumerable<IngestedChatConversation>> GetNewOrModifiedSessionsAsync(IEnumerable<IngestedChatConversation> existingSessions);

    /// <summary>
    /// Belirli bir session için chat mesajlarının embedding’lere dönüştürülmüş hâlini döner.
    /// </summary>
    Task<IEnumerable<IngestedChatMessage>> CreateMessagesForSessionAsync(IngestedChatConversation session);
}