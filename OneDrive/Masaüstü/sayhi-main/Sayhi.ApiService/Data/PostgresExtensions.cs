using Microsoft.EntityFrameworkCore;

namespace Sayhi.ApiService.Data
{
    public static class PostgresExtensions
    {
        public static IHostApplicationBuilder AddPostgresDbContext<T>(this WebApplicationBuilder builder, string connectionStringName)
            where T : DbContext
        {
            string? connectionString = builder.Configuration.GetConnectionString(connectionStringName);

            builder
                .Services
                .AddDbContext<T>(options =>
                {
                    options.EnableSensitiveDataLogging();
                    options.UseNpgsql(connectionString);
                });

            return builder;
        }

        public static WebApplication UsePostgres<T>(this WebApplication app)
            where T : DbContext
        {
            using (IServiceScope scope = app.Services.CreateScope())
            {
                T db = scope.ServiceProvider.GetRequiredService<T>();

                // Ensure database exists (creates tables but doesn't run migrations)
                // This is needed because migrations have dynamic values in HasData
                if (!db.Database.CanConnect())
                {
                    db.Database.EnsureCreated();
                }
                else
                {
                    // Try to apply migrations, but don't fail if there are pending model changes
                    try
                    {
                        db.Database.Migrate();
                    }
                    catch
                    {
                        // If migration fails, just ensure tables exist
                        db.Database.EnsureCreated();
                    }
                }
            }

            return app;
        }
    }
}
