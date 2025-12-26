//using Microsoft.Extensions.Hosting;
//using CommunityToolkit.Aspire.Hosting.PostgreSQL.Extensions;

var builder = DistributedApplication.CreateBuilder(args);

//bool isDev = builder.Environment.IsDevelopment();

// builder.AddDockerComposeEnvironment("docker-compose-artifacts");

//if (isDev)
//{
//    var db = builder.AddSqlite("db")
//        .WithSqliteWeb();
//}
//else
//{
    //var password = builder.AddParameter(builder.Configuration["DB:Password"]!, true);
    var username = builder.AddParameter("postgre-username", secret: true);
    var password = builder.AddParameter("postgre-password", secret: true);
    var chatDb = builder
        .AddPostgres("db-chat")
        .WithUserName(username)
        .WithPassword(password)
        .WithDbGate();

    //docker pull pgvector/pgvector:0.8.1-pg18-trixie

    var vectorUsername = builder.AddParameter("postgre-vector-username", secret: true);
    var vectorPassword = builder.AddParameter("postgre-vector-password", secret: true);
    var vectorDb = builder
        .AddPostgres("db-vector")
        .WithImage("pgvector/pgvector", "0.8.1-pg18-trixie")
        .WithUserName(vectorUsername)
        .WithPassword(vectorPassword)
        .WithInitFiles("init-vector.sql");

    var reportDb = builder
        .AddPostgres("db-report")
        .WithUserName(username)
        .WithPassword(password);

var apiService = builder
    .AddProject<Projects.Sayhi_ApiService>("apiservice")
    .WithReference(chatDb)
    .WithReference(reportDb)
    .WaitFor(chatDb)
    .WaitFor(reportDb)
    .WithHttpHealthCheck("/health")
    .PublishAsDockerFile();

//if (isDev)
//{
    builder
        //.AddViteApp(name: "chatui", workingDirectory: "../sayhi.web")

        .AddNpmApp("chatui", "../sayhi.web", "dev")
        .WithHttpEndpoint(env: "PORT", port: 5066)
        .WithAnnotation(new JavaScriptPackageManagerAnnotation("npm"))
        .WithMappedEndpointPort()
        .WithReference(apiService)
        .WaitFor(apiService)
        .WithNpmPackageInstallation()
        .PublishAsDockerFile();
//}
//else
//{
//    string staticDir = Path.GetFullPath("../sayhi.web/dist");

//    builder
//        .AddContainer("chatui", "nginx", "stable")
//        .WithBindMount(staticDir, "/usr/share/nginx/html", isReadOnly: true)
//        .WithHttpEndpoint(env: "PORT", port: 5066, targetPort: 80)
//        .WithExternalHttpEndpoints()
//        .WithReference(apiService)
//        .WaitFor(apiService);
//}

// You will need to set the connection string to your own value
// You can do this using Visual Studio's "Manage User Secrets" UI, or on the command line:
//   cd this-project-directory
//   dotnet user-secrets set ConnectionStrings:openai "Endpoint=https://models.inference.ai.azure.com;Key=YOUR-API-KEY"
//var openai = builder.AddConnectionString("openai");

var aiGateway = builder.AddProject<Projects.Sayhi_AIGateway>("ai-gateway")
    .WithReference(vectorDb)
    .WaitFor(vectorDb)
    .PublishAsDockerFile();
//.WithReference(openai)
//.WithHttpHealthCheck("/health")

builder.Build().Run();
