using Microsoft.Extensions.VectorData;

namespace Sayhi.AIGateway.Services;

public class IngestedChatMessage
{
    private const int VectorDimensions = 1536; // 1536 is the default vector size for the OpenAI text-embedding-3-small model
    private const string VectorDistanceFunction = DistanceFunction.CosineDistance;

    [VectorStoreKey]
    public required string Id { get; set; } = default!;

    [VectorStoreData]
    public string ConversationId { get; set; } = default!;

    [VectorStoreData]
    public string Role { get; set; } = default!; // user / assistant / system

    [VectorStoreData]
    public string Text { get; set; } = default!;

    [VectorStoreData]
    public string CreatedAt { get; set; } = default!;

    [VectorStoreVector(VectorDimensions, DistanceFunction = VectorDistanceFunction)]
    //public ReadOnlyMemory<float> Embedding { get; set; }
    public string? Vector => Text;
}
