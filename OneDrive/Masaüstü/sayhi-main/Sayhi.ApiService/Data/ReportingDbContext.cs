using Microsoft.EntityFrameworkCore;
using Sayhi.Model.Reports;

namespace Sayhi.ApiService.Data
{
    public class ReportingDbContext(DbContextOptions<ReportingDbContext> options, IWebHostEnvironment environment)
        : DbContext(options)
    {
        public DbSet<AgentChat> AgentChats => Set<AgentChat>();
        public DbSet<AiRequest> AiRequests => Set<AiRequest>();
        public DbSet<ChatSentiment> ChatSentiments => Set<ChatSentiment>();
        public DbSet<WordFrequency> WordFrequencies => Set<WordFrequency>();

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            ConfigureAgentChat(modelBuilder);
            ConfigureAiRequest(modelBuilder);
            ConfigureChatSentiment(modelBuilder);
            ConfigureWordFrequency(modelBuilder);
        }

        private static void ConfigureAgentChat(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AgentChat>(entity =>
            {
                entity.HasKey(e => e.Id);
                //entity.HasIndex(e => e.Date).IsUnique();
                entity.HasIndex(e => new { e.Date, e.AgentName }).IsUnique(false);
                //entity.Property(e => e.Date).IsRequired();
                entity.Property(e => e.AgentName).HasMaxLength(100).IsRequired();
            });
        }

        private static void ConfigureAiRequest(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AiRequest>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Date).IsUnique();
                //entity.HasIndex(e => new { e.Date, e.AgentName }).IsUnique(false);
                //entity.Property(e => e.Date).IsRequired();
                //entity.Property(e => e.AgentName).HasMaxLength(100).IsRequired();
            });
        }

        private static void ConfigureChatSentiment(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ChatSentiment>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Date).IsUnique();

                // ChatId'nin tekil olmasını ve hızlı erişim için indexlenmesini sağlar
                entity.HasIndex(e => e.ChatId).IsUnique();

                // Gün ve AgentName bazlı sorgulamalar için index
                entity.HasIndex(e => new { e.Date, e.AgentName }).IsUnique(false);

                entity.Property(e => e.ChatId).HasMaxLength(100).IsRequired();
                entity.Property(e => e.CustomerOverallTone).HasMaxLength(50).IsRequired();
                entity.Property(e => e.AgentOverallTone).HasMaxLength(50).IsRequired();
            });
        }

        private static void ConfigureWordFrequency(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<WordFrequency>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Date).IsUnique();
                entity.HasIndex(e => new { e.Date, e.Keyword }).IsUnique();
                entity.Property(e => e.Keyword).HasMaxLength(255).IsRequired();
            });
        }
    }
}