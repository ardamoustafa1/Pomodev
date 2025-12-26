using Microsoft.Extensions.VectorData;

namespace Sayhi.AIGateway.Services;

public class IngestedChatConversation
{
    [VectorStoreKey]
    public string Id { get; set; } = default!;

    [VectorStoreData]
    public string? Title { get; set; }

    [VectorStoreData]
    public string CreatedAt { get; set; } = default!;
}
