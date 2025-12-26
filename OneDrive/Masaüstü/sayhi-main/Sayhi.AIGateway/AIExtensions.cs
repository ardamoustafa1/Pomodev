using System.ClientModel;
using Microsoft.Extensions.AI;
using OpenAI;
using Sayhi.AIGateway.Services;
using Sayhi.AIGateway.Services.Ingestion;

namespace Sayhi.AIGateway;

public static class AIExtensions
{
    public static IHostApplicationBuilder AddAI(this IHostApplicationBuilder builder)
    {
        Func<string, string> getOption = (name) =>
            builder.Configuration[name] ?? throw new InvalidOperationException($"Missing configuration: {name}.");

        string optionsAiProvider = getOption("AI:Provider");

        OpenAIClient? openAIClient = null;
        IChatClient? chatClient = null;

        //   cd this-project-directory
        //   dotnet user-secrets set GitHubModels:Token YOUR-GITHUB-TOKEN
        //   dotnet user-secrets set AzureOpenAI:Endpoint https://YOUR-DEPLOYMENT-NAME.openai.azure.com
        //   dotnet user-secrets set OpenAI:Key YOUR-API-KEY

        if (optionsAiProvider == "GitHub")
        {
            openAIClient = new OpenAIClient(
                new ApiKeyCredential(getOption("GitHub:Token")),
                new OpenAIClientOptions()
                {
                    //Endpoint = new Uri("https://models.inference.ai.azure.com")
                    Endpoint = new Uri(getOption("GitHub:Endpoint"))
                });
            chatClient = openAIClient.GetChatClient(getOption("AI:Model")).AsIChatClient();
        }
        else if (optionsAiProvider == "AzureOpenAI")
        {
            throw new NotImplementedException();
            /*
            var azureOpenAIEndpoint = new Uri(new Uri(getOption("AzureOpenAI:Endpoint")), "/openai/v1");
#pragma warning disable OPENAI001 // OpenAIClient(AuthenticationPolicy, OpenAIClientOptions) and GetOpenAIResponseClient(string) are experimental and subject to change or removal in future updates.
            openAIClient = new OpenAIClient(
                new BearerTokenPolicy(new DefaultAzureCredential(), "https://ai.azure.com/.default"),
                new OpenAIClientOptions { Endpoint = azureOpenAIEndpoint });

            chatClient = openAIClient.GetOpenAIResponseClient(getOption("AI:Model")).AsIChatClient();
#pragma warning restore OPENAI001
            */
        }
        else if (optionsAiProvider == "OpenAI")
        {
            openAIClient = new OpenAIClient(
                new ApiKeyCredential(getOption("OpenAI:Key")));

#pragma warning disable OPENAI001 // GetOpenAIResponseClient(string) is experimental and subject to change or removal in future updates.
            chatClient = openAIClient.GetOpenAIResponseClient(getOption("AI:Model")).AsIChatClient();
#pragma warning restore OPENAI001
        }
        else
        {
            throw new InvalidOperationException("Missing AI configuration");
        }

        //IEmbeddingGenerator<string, Embedding<float>> embeddingGenerator =
        var embeddingGenerator = openAIClient!.GetEmbeddingClient(getOption("AI:EmbeddingModel")).AsIEmbeddingGenerator();

        //var vectorStorePath = Path.Combine(AppContext.BaseDirectory, getOption("AI:VectorStore"));
        //var vectorStoreConnectionString = $"Data Source={vectorStorePath}";
        string vectorStoreConnectionString = builder.Configuration.GetConnectionString("db-vector")!;

        //builder.Services.AddSqliteCollection<string, IngestedChunk>("data-eyay-chunks", vectorStoreConnectionString);
        builder.Services.AddPostgresCollection<string, IngestedChunk>("data-eyay-chunks", vectorStoreConnectionString);
        //builder.Services.AddSqliteCollection<string, IngestedDocument>("data-eyay-documents", vectorStoreConnectionString);
        builder.Services.AddPostgresCollection<string, IngestedDocument>("data-eyay-documents", vectorStoreConnectionString);
        //builder.Services.AddSqliteCollection<string, IngestedChatConversation>("data-eyay-history", vectorStoreConnectionString);
        builder.Services.AddPostgresCollection<string, IngestedChatConversation>("data-eyay-history", vectorStoreConnectionString);
        //builder.Services.AddSqliteCollection<string, IngestedChatMessage>("data-eyay-history-lines", vectorStoreConnectionString);
        builder.Services.AddPostgresCollection<string, IngestedChatMessage>("data-eyay-history-lines", vectorStoreConnectionString);
        builder.Services.AddScoped<DataIngestor>();
        //builder.Services.AddScoped<ChatHistoryIngestor>();
        builder.Services.AddSingleton<ChatHistoryService>();
        builder.Services.AddSingleton<SemanticSearch>();
        builder.Services.AddChatClient(chatClient).UseFunctionInvocation().UseLogging();
        builder.Services.AddEmbeddingGenerator(embeddingGenerator);
        ////builder.Services.AddKeyedEmbeddingGenerator("documentsEmbed", embeddingGenerator);
        //builder.Services.AddKeyedEmbeddingGenerator("historyEmbed", embeddingGenerator);

        builder.Services.AddScoped<IChatService, ChatService>();

        return builder;
    }

    /*
    public static IHostApplicationBuilder AddAI2(this IHostApplicationBuilder builder)
    {
        // ConnectionStrings:openai "Endpoint=https://models.inference.ai.azure.com;Key=YOUR-API-KEY"
        var openai = builder.AddAzureOpenAIClient("openai");

        openai.AddChatClient(builder.Configuration["AI:Model"])
            .UseFunctionInvocation()
            .UseOpenTelemetry(configure: c =>
                c.EnableSensitiveData = builder.Environment.IsDevelopment());
        openai.AddEmbeddingGenerator(builder.Configuration["AI:EmbeddingModel"]);

        builder.Services.AddScoped<IChatService, ChatService>();

        return builder;
    }

    public ()
    {
        IChatClient chatClient = 
            environment == "Development"
                ? new OllamaApiClient("YOUR-OLLAMA-ENDPOINT", "qwen3")
                : new AzureOpenAIClient("YOUR-AZURE-OPENAI-ENDPOINT", new DefaultAzureCredential())
                    .GetChatClient("gpt-4.1")
                    .AsIChatClient();

        IEmbeddingGenerator<string, Embedding<float>> embeddingGenerator = 
            environment == "Development"
                ? new OllamaApiClient("YOUR-OLLAMA-ENDPOINT", "all-minilm")
                : new AzureOpenAIClient("YOUR-AZURE-OPENAI-ENDPOINT", new DefaultAzureCredential())
                    .GetEmbeddingClient("text-embedding-3-small")
                    .AsIEmbeddingGenerator();

        var embedding = await embeddingGenerator.GenerateAsync("What is AI?");

        VectorStoreCollection<int, Product> collection =
            environment == "Development"
                ? new SqliteCollection<int, Product>(
                    "Data Source=products.db",
                    "products", 
                    new SqliteCollectionOptions { EmbeddingGenerator = embeddingGenerator})
                : new QdrantCollection<int, Product>(
                    new QdrantClient("YOUR-HOSTED-ENDPOINT"), 
                    "products", 
                    true, 
                    new QdrantCollectionOptions { EmbeddingGenerator = embeddingGenerator});
    }

    */

    public static async Task<WebApplication> UseAI(this WebApplication app/*, IWebHostEnvironment environment*/)
    {
        // By default, we ingest PDF files from the /wwwroot/Data directory. You can ingest from
        // other sources by implementing IIngestionSource.
        // Important: ensure that any content you ingest is trusted, as it may be reflected back
        // to users or could be a source of prompt injection risk.
        await DataIngestor.IngestDataAsync(
            app.Services,
            new PDFDirectorySource(Path.Combine(app.Environment.WebRootPath, "Data")));

        //await ChatHistoryIngestor.UseChatHistory(app.Services);
        await ChatHistoryService.UseChatHistory(app.Services);
        //await app.Services.UseChatHistory();

        return app;
    }

    //public static async Task UseChatHistory(this IServiceProvider services)
    //{
    //    using var scope = services.CreateScope();
    //    var chatHistoryService = scope.ServiceProvider.GetRequiredService<ChatHistoryService>();
    //    await chatHistoryService.EnsureCollections();
    //}
}