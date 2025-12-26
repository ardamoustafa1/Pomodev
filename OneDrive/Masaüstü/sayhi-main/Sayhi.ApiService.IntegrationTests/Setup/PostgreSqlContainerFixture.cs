using Testcontainers.PostgreSql;

namespace Sayhi.ApiService.IntegrationTests.Setup
{
    public sealed class PostgreSqlAppDbContainerFixture : IAsyncLifetime
    {
        private readonly PostgreSqlContainer chatDbContainer = new PostgreSqlBuilder()
            .WithImage("postgres")
            .WithDatabase("db-chat")
            .WithUsername("yetkili-biri")
            .WithPassword("Gecersiz@123.,!")
            .WithCleanUp(true)
            .Build();
        public PostgreSqlContainer ChatDbContainer { get => chatDbContainer; }

        private readonly PostgreSqlContainer reportDbContainer = new PostgreSqlBuilder()
            .WithImage("postgres")
            .WithDatabase("db-report")
            .WithUsername("yetkili-biri")
            .WithPassword("Gecersiz@123.,!")
            .WithCleanUp(true)
            .Build();
        public PostgreSqlContainer ReportDbContainer { get => reportDbContainer; }

        /*
        [Fact]
        public void ExecuteCommand()
        {
            using var connection = new NpgsqlConnection(postgreSqlContainer.GetConnectionString());
            using var command = new NpgsqlCommand();
            connection.Open();
            command.Connection = connection;
            command.CommandText = "SELECT 1";
            command.ExecuteReader();
        }
        */
        public async Task InitializeAsync()
        {
            Console.WriteLine("FIX");
            await chatDbContainer.StartAsync();
            await reportDbContainer.StartAsync();

            /*
            await postgreSqlContainer.StartAsync();

            // Ensure database schema exists before tests run.
            // Use EnsureCreated for integration tests where migrations are not required;
            // replace with MigrateAsync if you want to apply real migrations.
            await using var context = CreateContext();
            await context.Database.EnsureCreatedAsync();
            */
        }

        public async Task DisposeAsync()
        {
            await chatDbContainer.StopAsync();
            await chatDbContainer.DisposeAsync();

            await reportDbContainer.StopAsync();
            await reportDbContainer.DisposeAsync();
        }
    }
}
