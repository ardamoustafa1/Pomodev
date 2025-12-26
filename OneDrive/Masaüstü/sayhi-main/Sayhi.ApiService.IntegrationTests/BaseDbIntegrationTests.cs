using Docker.DotNet.Models;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sayhi.ApiService.Data;
using Sayhi.ApiService.IntegrationTests.Setup;

namespace Sayhi.ApiService.IntegrationTests
{
    [CollectionDefinition("DatabaseCollection")]
    public class DatabaseCollection : ICollectionFixture<PostgreSqlAppDbContainerFixture>
    //public class DatabaseCollection : ICollectionFixture<CustomWebApplicationFactory>
    {
    }

    /*
    [Collection("DatabaseCollection")]
    public class BaseIntegrationTests : IClassFixture<PostgreSqlAppDbContainerFixture>
    {
    }
    */

    [Collection("DatabaseCollection")]
    //public class BaseDbIntegrationTests : IClassFixture<PostgreSqlAppDbContainerFixture>, IAsyncLifetime
    public class BaseDbIntegrationTests :
        //IClassFixture<PostgreSqlAppDbContainerFixture>,
        IClassFixture<CustomWebApplicationFactory>,
        IAsyncLifetime
    {
        //protected readonly PostgreSqlAppDbContainerFixture fixture;
        protected readonly CustomWebApplicationFactory factory;
        private readonly IServiceScope scope;
        protected readonly IWebHostEnvironment testEnvironment = new TestWebHostEnvironment();

        private AppDbContext? chatDbContext;
        private ReportingDbContext? reportingDbContext;

        protected BaseDbIntegrationTests(
            //PostgreSqlAppDbContainerFixture fixture,
            CustomWebApplicationFactory factory)
        {
            //this.fixture = fixture;
            this.factory = factory;
            //fixture = factory.Services.GetRequiredService<PostgreSqlAppDbContainerFixture>();

            scope = factory.Services.CreateScope();
            //_db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            chatDbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            reportingDbContext = scope.ServiceProvider.GetRequiredService<ReportingDbContext>();
        }

        public virtual async Task InitializeAsync()
        {
            //Console.WriteLine("TEST");
            //await factory.InitializeAsync();

            //chatDbContext = CreateChatDbContext();
            //reportingDbContext = CreateReportingDbContext();

            await chatDbContext.Database.EnsureDeletedAsync();
            await reportingDbContext.Database.EnsureDeletedAsync();

            await chatDbContext.Database.EnsureCreatedAsync();
            await reportingDbContext.Database.EnsureCreatedAsync();
        }

        public virtual async Task DisposeAsync()
        {
            if (chatDbContext != null)
            {
                await chatDbContext.DisposeAsync();
            }

            if (reportingDbContext != null)
            {
                await reportingDbContext.DisposeAsync();
            }

            //await factory.DisposeAsync();
            scope.Dispose();
        }

        public virtual AppDbContext CreateChatDbContext()
        {
            //var connectionString = fixture.ChatDbContainer.GetConnectionString();
            var connectionString = factory.ChatDbConnectionString;
            var builder = new DbContextOptionsBuilder<AppDbContext>()
                .UseNpgsql(connectionString, npgsqlOptions => npgsqlOptions.EnableRetryOnFailure());
            var options = builder.Options;

            return new AppDbContext(options, testEnvironment);
        }

        public virtual ReportingDbContext CreateReportingDbContext()
        {
            //var connectionString = fixture.ReportingDbContext.GetConnectionString();
            var connectionString = factory.ReportingDbConnectionString;
            var builder = new DbContextOptionsBuilder<ReportingDbContext>()
                .UseNpgsql(connectionString, npgsqlOptions => npgsqlOptions.EnableRetryOnFailure());
            var options = builder.Options;

            return new ReportingDbContext(options, testEnvironment);
        }
    }
}
