//using Microsoft.Data.Sqlite;
//using Microsoft.EntityFrameworkCore;

//namespace Sayhi.ApiService.Data
//{
//    public static class SqliteExtensions
//    {
//        public static IHostApplicationBuilder AddSqliteDbContext<T>(this WebApplicationBuilder builder)
//            where T : DbContext
//        {
//            string dbContextName = typeof(T).Name;

//            string? connectionString = builder.Configuration.GetConnectionString(dbContextName);

//            builder
//                .Services
//                .AddDbContext<AppDbContext>(options =>
//                {
//                    options.EnableSensitiveDataLogging();
//                    options.UseSqlite(connectionString);
//                });

//            return builder;
//        }

//        public static WebApplication UseSqlite(this WebApplication app)
//        {
//            using (var scope = app.Services.CreateScope())
//            {
//                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

//                EnsureDataFolder(db, app.Environment.ContentRootPath);

//                db.Database.EnsureCreated();
//                db.Database.Migrate();
//            }

//            return app;
//        }

//        private static void EnsureDataFolder(AppDbContext db, string rootPath)
//        {
//            var conn = db.Database.GetDbConnection();

//            if (conn is not SqliteConnection sqliteConn)
//                return;

//            var relativeDir = Path.GetDirectoryName(sqliteConn.DataSource);

//            if (string.IsNullOrEmpty(relativeDir))
//                return;

//            var absoluteDir = Path.Combine(rootPath, relativeDir);

//            if (Directory.Exists(absoluteDir))
//                return;

//            Directory.CreateDirectory(absoluteDir);
//        }
//    }
//}
