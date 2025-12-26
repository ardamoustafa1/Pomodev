//using System.Collections.Concurrent;

//namespace Sayhi.AIGateway.Services.Ingestion;

//public class ChatHistorySource : IChatHistorySource
//{
//    private readonly string connectionString;

//    //private readonly ConcurrentDictionary<string, IngestedChatConversation> ;

//    public string ConversationId { get; }

//    public ChatHistorySource(string connectionString, string conversationId)
//    {
//        this.connectionString = connectionString;
//        this.ConversationId = conversationId;
//    }

//    public async Task<IEnumerable<IngestedChatConversation>> GetDeletedSessionsAsync(IEnumerable<IngestedChatConversation> existingSessions)
//    {
//        List<IngestedChatConversation> deleted = new ();
//        using var conn = new SQLiteConnection(connectionString);
//        await conn.OpenAsync();

//        foreach (var session in existingSessions)
//        {
//            using var cmd = new SQLiteCommand("SELECT COUNT(*) FROM ChatSessions WHERE SessionId=@id", conn);
//            cmd.Parameters.AddWithValue("@id", session.SessionId);
//            var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
//            if (count == 0)
//                deleted.Add(session);
//        }

//        return deleted;
//    }

//    public async Task<IEnumerable<IngestedChatConversation>> GetNewOrModifiedSessionsAsync(IEnumerable<IngestedChatConversation> existingSessions)
//    {
//        List<IngestedChatConversation> sessions = new ();
//        using var conn = new SQLiteConnection(connectionString);
//        await conn.OpenAsync();

//        using var cmd = new SQLiteCommand("SELECT SessionId, Title, CreatedAt FROM ChatSessions", conn);
//        using var reader = await cmd.ExecuteReaderAsync();

//        while (await reader.ReadAsync())
//        {
//            var sessionId = reader.GetString(0);
//            var title = reader.IsDBNull(1) ? null : reader.GetString(1);
//            var createdAt = DateTimeOffset.Parse(reader.GetString(2));

//            var ingested = new IngestedChatConversation()
//            {
//                Id = sessionId,
//                //SessionId = sessionId,
//                Title = title,
//                CreatedAt = createdAt
//            };

//            if (!existingSessions.Any(s => s.Id == sessionId))
//                sessions.Add(ingested);
//        }

//        return sessions;
//    }

//    public async Task<IEnumerable<IngestedChatMessage>> CreateMessagesForSessionAsync(IngestedChatConversation session)
//    {
//        var messages = new List<IngestedChatMessage>();
//        using var conn = new SQLiteConnection(connectionString);
//        await conn.OpenAsync();

//        using var cmd = new SQLiteCommand(
//            "SELECT MessageId, Role, Content, Timestamp FROM ChatMessages WHERE SessionId=@sid ORDER BY Timestamp",
//            conn);
//        cmd.Parameters.AddWithValue("@sid", session.Id);

//        using var reader = await cmd.ExecuteReaderAsync();
//        while (await reader.ReadAsync())
//        {
//            var messageId = reader.GetString(0);
//            var role = reader.GetString(1);
//            var content = reader.GetString(2);
//            var timestamp = DateTimeOffset.Parse(reader.GetString(3));

//            var ingestedMessage = new IngestedChatMessage
//            {
//                Id = $"{session.SessionId}:{messageId}", // unique Key
//                ConversationId = session.Id,
//                Role = role,
//                Text = content,
//                CreatedAt = timestamp
//            };

//            messages.Add(ingestedMessage);
//        }

//        return messages;
//    }
//}