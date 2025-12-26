using System.Reflection;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Sayhi.ApiService.Data;

namespace Sayhi.ApiService.IntegrationTests.Setup
{
    public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
    {
        private readonly PostgreSqlAppDbContainerFixture fixture;
        //private PostgreSqlAppDbContainerFixture fixture;

        public string ChatDbConnectionString { get => fixture.ChatDbContainer.GetConnectionString(); }

        public string ReportingDbConnectionString { get => fixture.ReportDbContainer.GetConnectionString(); }


        //public CustomWebApplicationFactory() { }
        public CustomWebApplicationFactory(PostgreSqlAppDbContainerFixture fixture)
        {
            this.fixture = fixture;
        }

        protected override IHost CreateHost(IHostBuilder builder)
        {
            builder.ConfigureServices(async services =>
            {
                //var fixture = Services.GetRequiredService<PostgreSqlAppDbContainerFixture>();

                //fixture = new PostgreSqlAppDbContainerFixture();
                //services.AddSingleton(fixture);
                //await fixture.InitializeAsync();

                //Assembly appAssembly = typeof(Program).Assembly;
                //Type appDbContextType = typeof(AppDbContext);
                //Type reportingDbContextType = appAssembly.GetTypes().FirstOrDefault(t => t.Name == "ReportingDbContext");

                Remove<AppDbContext>(services);
                Remove<ReportingDbContext>(services);

                /// in-memory
                //services.AddDbContext<AppDbContext>(options =>
                //  options.UseInMemoryDatabase("IntegrationTest_AppDb"));

                services.AddDbContext<AppDbContext>(options =>
                {
                    options.UseNpgsql(fixture.ChatDbContainer.GetConnectionString());
                });

                services.AddDbContext<ReportingDbContext>(options =>
                {
                    options.UseNpgsql(fixture.ReportDbContainer.GetConnectionString());
                });

                Assembly assembly = typeof(ApiService.Services.AgentService).Assembly;

                services.RegisterRepositories(assembly);
                services.RegisterServices(assembly);

                //await ResetDatabaseAsync();
            });

            //builder.UseEnvironment("Testing"); // appsettings.Testing.json varsa yükler

            return base.CreateHost(builder);
        }

        /*
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureTestServices(services =>
            {
                //services.RemoveAll(typeof(DbContextOptions<AppDbContext>));
                //services.AddSqlServer<AppDbContext>($"{_connString};Database=BlindDateTestDb;");

                //services.RemoveDbContext<AppDbContext>();
                //services.AddDbContext<AppDbContext>(options => { options.UseNpgsql("the new connection string"); });
                //services.EnsureDbCreated<AppDbContext>();
            });
        }
        */

        public async Task InitializeAsync()
        {
            Console.WriteLine("FAC");
            await fixture.InitializeAsync();

        //    ////await ResetDatabaseAsync<AppDbContext>();
        //    ////await ResetDatabaseAsync<ReportingDbContext>();
        }

        public new async Task DisposeAsync()
        {
        //    await fixture.DisposeAsync();
            await base.DisposeAsync();
        }

        public T? GetDatabase<T>()
            where T : DbContext
        {
            //using var scope = services.BuildServiceProvider().CreateScope();
            using var scope = Services.CreateScope();
            var db = scope.ServiceProvider.GetService<T>();
            return db;
        }

        /*
        public async Task ResetDatabaseAsync<T>()
            where T : DbContext
        {
            ////using var scope = services.BuildServiceProvider().CreateScope();
            //using var scope = Services.CreateScope();
            //var db = scope.ServiceProvider.GetRequiredService<T>();
            var db = GetDatabase<T>();

            if (db == null)
                return;

            await db.Database.EnsureDeletedAsync();
            await db.Database.EnsureCreatedAsync();
            //await db.Database.MigrateAsync();
        }
        */

        private void Remove<T>(IServiceCollection services)
            where T : DbContext
        {
            Type dbContextType = typeof(T);

            services
                //.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                .Where(d =>
                    d.ServiceType == dbContextType ||
                    //d.ServiceType == typeof(DbContextOptions<AppDbContext>))
                    (d.ServiceType.IsGenericType && d.ServiceType.GetGenericTypeDefinition() == typeof(DbContextOptions<>) &&
                     d.ServiceType.GenericTypeArguments[0] == dbContextType))
                .ToList()
                .ForEach(d =>
                    services.Remove(d));
        }
    }
}