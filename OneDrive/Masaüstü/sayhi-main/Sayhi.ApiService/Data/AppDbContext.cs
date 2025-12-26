using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Sayhi.Model;

namespace Sayhi.ApiService.Data
{
    public class AppDbContext(DbContextOptions<AppDbContext> options, IWebHostEnvironment environment)
        : DbContext(options)
    {
        public DbSet<Person> People => Set<Person>();
        public DbSet<Chat> Chats => Set<Chat>();
        public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
        public DbSet<ChatParticipant> ChatParticipants => Set<ChatParticipant>();
        public DbSet<Agent> Agents { get; set; }
        public DbSet<Skill> Skills { get; set; }
        public DbSet<AgentSkill> AgentSkills { get; set; }
        public DbSet<Group> Groups { get; set; }
        public DbSet<Queue> Queues { get; set; }
        public DbSet<QueueAssignment> QueueAssignments { get; set; }
        public DbSet<QueueSkill> QueueSkills { get; set; }

        //private char? quoteBegin = null;
        //private char? quoteEnd = null;

        /*
        Constructor
            ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
            ChangeTracker.AutoDetectChangesEnabled = false;
        */

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            //if (Database.ProviderName?.Contains("SqlServer") == true)
            //{
            //    quoteBegin = '[';
            //    quoteEnd= ']';
            //}
            //{
            //    quoteBegin = '\"';
            //    quoteEnd = '\"';
            //}
            //else
            //if (Database.IsSqlite() || Database.ProviderName?.Contains("Sqlite") == true)
            //{
            //    //    quoteBegin = null;
            //    //    quoteEnd = null;

            //    foreach (var entityType in modelBuilder.Model.GetEntityTypes())
            //    {
            //        var properties = entityType.ClrType.GetProperties().Where(p => p.PropertyType == typeof(DateTimeOffset)
            //                                                                    || p.PropertyType == typeof(DateTimeOffset?));
            //        foreach (var property in properties)
            //        {
            //            modelBuilder
            //                .Entity(entityType.Name)
            //                .Property(property.Name)
            //                .HasConversion(new DateTimeOffsetToBinaryConverter());
            //                //.HasConversion(new DateTimeOffsetToUtcDateTimeTicksConverter());
            //        }
            //    }
            //}

            //else if (Database.ProviderName?.Contains("PostgreSQL") == true)
            // Tüm "decimal" property'ler için global konfigürasyon
            /*
            foreach (var property in modelBuilder.Model.GetEntityTypes()
                .SelectMany(t => t.GetProperties())
                .Where(p => p.ClrType == typeof(decimal) || p.ClrType == typeof(decimal?)))
            {
                property.SetPrecision(18);
                property.SetScale(2);
            }
            */
            /*
            foreach (var entity in modelBuilder.Model.GetEntityTypes())
            {
                // Tablo isimlerini plural yap
                //entity.SetTableName(entity.DisplayName() + "s");

                //entity.SetTableName(entity.GetTableName().ToSnakeCase()); // opsiyonel

                //if (typeof(ISoftDelete).IsAssignableFrom(entity.ClrType))
                //{
                //    modelBuilder
                //        .Entity(entity.ClrType)
                //        .HasQueryFilter(e => !EF.Property<bool>(e, "IsDeleted"));
                //}
            }
            */

            /*
            modelBuilder
                .Entity<Chat>()
                .HasOne(c => c.Person1)
                .WithMany()
                .HasForeignKey(c => c.Person1Id);

            modelBuilder
                .Entity<Chat>()
                .HasOne(c => c.Person2)
                .WithMany()
                .HasForeignKey(c => c.Person2Id);
            */
            /*
            modelBuilder.Entity<Chat>()
                .HasMany(c => c.Participants)
                .WithMany(p => p.Chats)
                .UsingEntity(j => j.ToTable("ChatParticipants"));
            */

            ConfigurePerson(modelBuilder);
            ConfigureChat(modelBuilder);
            ConfigureChatMessage(modelBuilder);
            ConfigureChatParticipant(modelBuilder);
            ConfigureAgent(modelBuilder);
            ConfigureSkill(modelBuilder);
            ConfigureAgentSkill(modelBuilder);
            ConfigureGroup(modelBuilder);
            ConfigureAgentGroup(modelBuilder);
            ConfigureQueue(modelBuilder);
            ConfigureQueueAssignment(modelBuilder);
            ConfigureQueueSkill(modelBuilder);

            AddSampleData(modelBuilder);

            try
            {
                var personSystem = new Person() { Id = Hubs.ChatService.SystemHubUser.Id, Email = "system@nomail.com", Name = Hubs.ChatService.SystemHubUser.Name, Password = Utils.Hash("1") };
                //modelBuilder.Entity<Person>().HasData(personSystem);
                if (People.Find(personSystem.Id) == null)
                {
                    People.Add(personSystem);
                    SaveChanges();
                }
            }
            catch
            {
            }
        }

        private static void ConfigurePerson(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Person>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
            });
        }

        private static void ConfigureChat(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Chat>()
               .Property(c => c.Tags)
               .HasConversion(
                   v => JsonSerializer.Serialize(v),
                   v => JsonSerializer.Deserialize<Dictionary<string, AlertType>>(v) ?? new())
               .HasColumnType("TEXT");
        }

        private static void ConfigureChatParticipant(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<ChatParticipant>()
                .HasKey(cp => new { cp.ChatId, cp.PersonId });

            modelBuilder.Entity<ChatParticipant>()
                .HasOne(cp => cp.Chat)
                .WithMany(c => c.Participants)
                .HasForeignKey(cp => cp.ChatId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ChatParticipant>()
                .HasOne(cp => cp.Person)
                .WithMany(p => p.Chats)
                .HasForeignKey(cp => cp.PersonId)
                .OnDelete(DeleteBehavior.Cascade);
        }

        private static void ConfigureChatMessage(ModelBuilder modelBuilder)
        {
            modelBuilder
                .Entity<ChatMessage>()
                .HasOne(cm => cm.Chat)
                .WithMany(c => c.Messages)
                .HasForeignKey(cm => cm.ChatId);
            //.OnDelete(DeleteBehavior.Cascade);

            modelBuilder
                .Entity<ChatMessage>()
                .HasOne(cm => cm.Sender)
                .WithMany()
                .HasForeignKey(cm => cm.SenderId);
            //.OnDelete(DeleteBehavior.Cascade);
        }

        private void ConfigureAgent(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Agent>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasOne(e => e.Person)
                    .WithOne(p => p.Agent)
                    .HasForeignKey<Agent>(e => e.Id)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(e => e.EmployeeId)
                    .IsUnique();
                //.HasDatabaseName("IX_Agents_EmployeeId")
                //.HasFilter($"{quoteBegin}EmployeeId{quoteEnd} IS NOT NULL");
            });
        }

        private static void ConfigureSkill(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Skill>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Name).IsUnique();
                entity.HasIndex(e => e.Category);
            });
        }

        private static void ConfigureAgentSkill(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AgentSkill>(entity =>
            {
                entity.HasKey(e => new { e.AgentId, e.SkillId });

                entity.HasOne(e => e.Agent)
                      .WithMany(a => a.AgentSkills)
                      .HasForeignKey(e => e.AgentId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Skill)
                      .WithMany(s => s.AgentSkills)
                      .HasForeignKey(e => e.SkillId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private static void ConfigureGroup(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Group>(entity =>
            {
                entity.HasKey(e => e.Id);

                entity.HasIndex(e => e.Name).IsUnique();

                entity.HasOne(e => e.Manager)
                    .WithMany()
                    .HasForeignKey(e => e.ManagerId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasIndex(e => e.Type);
            });
        }

        private static void ConfigureAgentGroup(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<AgentGroup>(entity =>
            {
                //entity.HasKey(e => e.Id);
                //entity.HasIndex(e => new { e.AgentId, e.GroupId });
                entity.HasKey(e => new { e.AgentId, e.GroupId });
                //entity.HasIndex(e => e.IsActive);

                entity.HasOne(e => e.Agent)
                     .WithMany(a => a.AgentGroups)
                     .HasForeignKey(e => e.AgentId)
                     .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Group)
                      .WithMany(g => g.AgentGroups)
                      .HasForeignKey(e => e.GroupId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private static void ConfigureQueue(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Queue>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Name).IsUnique();
                entity.HasIndex(e => e.Type);
                entity.HasIndex(e => e.GroupId);
            });
        }

        private static void ConfigureQueueAssignment(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<QueueAssignment>(entity =>
            {
                //entity.HasKey(e => e.Id);
                //entity.HasIndex(e => new { e.AgentId, e.QueueId });
                entity.HasKey(e => new { e.AgentId, e.QueueId });
                //entity.HasIndex(e => e.IsActive);

                entity.HasOne(e => e.Agent)
                     .WithMany(a => a.QueueAssignments)
                     .HasForeignKey(e => e.AgentId)
                     .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Queue)
                      .WithMany(q => q.QueueAssignments)
                      .HasForeignKey(e => e.QueueId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }

        private static void ConfigureQueueSkill(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<QueueSkill>(entity =>
            {
                entity.HasKey(e => new { e.QueueId, e.SkillId });

                entity.HasOne(e => e.Queue)
                      .WithMany(q => q.QueueSkills)
                      .HasForeignKey(e => e.QueueId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(e => e.Skill)
                      .WithMany(s => s.QueueSkills)
                      .HasForeignKey(e => e.SkillId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }

        /* Audit
        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SetAuditFields();
            return await base.SaveChangesAsync(cancellationToken);
        }

        private void SetAuditFields()
        {
            var entries = ChangeTracker.Entries()
                .Where(e => e.Entity is IAuditable &&
                           (e.State == EntityState.Added || e.State == EntityState.Modified));

            foreach (var entry in entries)
            {
                var entity = (IAuditable)entry.Entity;
                if (entry.State == EntityState.Added)
                {
                    entity.CreatedDate = DateTimeOffset.UtcNow;
                }
                entity.ModifiedDate = DateTimeOffset.UtcNow;
            }
        }
        */

        public void AddSampleData(ModelBuilder modelBuilder)
        {
            var personSystem = new Person() { Id = Hubs.ChatService.SystemHubUser.Id, Email = "system@nomail.com", Name = Hubs.ChatService.SystemHubUser.Name, Password = Utils.Hash("1") };
            var personAI = new Person() { Id = Hubs.ChatService.AIHubUser.Id, Email = "ai@nomail.com", Name = Hubs.ChatService.AIHubUser.Name, Password = Utils.Hash("1") };
            var person1 = new Person() { Id = Guid.Parse("00000000-0000-0000-0000-000000000120"), Email = "ozgur.civi@outlook.com", Name = "Özgür Çivi", Password = Utils.Hash("1"), AvatarUrl = "https://0.gravatar.com/avatar/b42f914d14fdd06440f626ee2d8e68c5fe4fb4c5f97386ac12ad0267edbcd8fc" };
            var person2 = new Person() { Id = Guid.Parse("00000000-0000-0000-0000-000000000121"), Email = "ozgur.civi@gmail.com", Name = "Mikail Çivi", Password = Utils.Hash("1"), AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Mikail" };
            var person3 = new Person() { Id = Guid.Parse("00000000-0000-0000-0000-000000000122"), Email = "ozgur_civi@yahoo.com", Name = "Timur Çivi", Password = Utils.Hash("1"), AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Timur" };
            var person4 = new Person() { Id = Guid.Parse("00000000-0000-0000-0000-000000000123"), Email = "ozgur.civi@yubis.com", Name = "Güven Çivi", Password = Utils.Hash("1"), AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Gueven" };
            var person5 = new Person() { Id = Guid.Parse("00000000-0000-0000-0000-000000000124"), Email = "mehmet.kaya@yubis.com", Name = "Mehmet Kaya", Password = Utils.Hash("4"), AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Mehmet" };
            var person6 = new Person() { Id = Guid.Parse("00000000-0000-0000-0000-000000000125"), Email = "jitewaboh@lagify.com", Name = "Ahmet Yılmaz", Password = Utils.Hash("2"), AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmet" };
            var person7 = new Person() { Id = Guid.Parse("00000000-0000-0000-0000-000000000126"), Email = "aysed@outlook.com", Name = "Ayşe Demir", Password = Utils.Hash("3"), AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Ayse" };
            var person8 = new Person() { Id = Guid.Parse("00000000-0000-0000-0000-000000000127"), Email = "zeynep.sahin@gmail.com", Name = "Zeynep Şahin", Password = Utils.Hash("5"), AvatarUrl = "https://api.dicebear.com/7.x/avataaars/svg?seed=Zeynep" };

            modelBuilder.Entity<Person>().HasData(
                personSystem,
                personAI,
                person1,
                person2,
                person3,
                person4,
                person5,
                person6,
                person7,
                person8);

            Func<Chat, Chat> SetRandom = chat =>
            {
                SourceType source = (SourceType)Random.Shared.Next(Enum.GetValues(typeof(SourceType)).Length);

                Dictionary<string, AlertType> allTags = new()
                {
                    { "Order", AlertType.Normal },
                    { "Angry", AlertType.Alert },
                    { "Product", AlertType.Warn },
                    { "Verified", AlertType.Info }
                };

                var keys = allTags.Keys.ToArray();

                Dictionary<string, AlertType> tags = Enumerable
                    .Repeat(0, Random.Shared.Next(0, 5))
                    .Select(i => keys[Random.Shared.Next(keys.Length - 1)])
                    .Distinct()
                    .ToDictionary(key => key, key => allTags[key]);

                chat.Source = source;
                chat.Tags = tags;

                return chat;
            };

            var chat1 = SetRandom(new Chat() { CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-220) });
            var chat2 = SetRandom(new Chat() { CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-130) });
            var chat3 = SetRandom(new Chat() { CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-90) });
            var chat4 = SetRandom(new Chat() { CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-80) });
            var chat5 = SetRandom(new Chat() { CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-70) });
            var chat6 = SetRandom(new Chat() { CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-60) });
            var chat7 = SetRandom(new Chat() { CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-50) });
            var chat8 = SetRandom(new Chat() { CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-40) });
            var chat9 = SetRandom(new Chat() { CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30) });
            var chat10 = SetRandom(new Chat() { CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-20) });
            var chat11 = SetRandom(new Chat() { CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-10) });
            var chat12 = SetRandom(new Chat() { Name = "Bizim Elemanlar", CreatedAt = DateTimeOffset.UtcNow });

            modelBuilder.Entity<Chat>().HasData(
                chat1,
                chat2,
                chat3,
                chat4,
                chat5,
                chat6,
                chat7,
                chat8,
                chat9,
                chat10,
                chat11,
                chat12
            );

            modelBuilder.Entity<ChatParticipant>().HasData(
                new ChatParticipant() { ChatId = chat1.Id, PersonId = person1.Id },
                new ChatParticipant() { ChatId = chat1.Id, PersonId = person2.Id },

                new ChatParticipant() { ChatId = chat2.Id, PersonId = person1.Id },
                new ChatParticipant() { ChatId = chat2.Id, PersonId = person3.Id },

                new ChatParticipant() { ChatId = chat3.Id, PersonId = person1.Id },
                new ChatParticipant() { ChatId = chat3.Id, PersonId = person4.Id },

                new ChatParticipant() { ChatId = chat4.Id, PersonId = person1.Id },
                new ChatParticipant() { ChatId = chat4.Id, PersonId = person5.Id },

                new ChatParticipant() { ChatId = chat5.Id, PersonId = person1.Id },
                new ChatParticipant() { ChatId = chat5.Id, PersonId = person6.Id },

                new ChatParticipant() { ChatId = chat6.Id, PersonId = person1.Id },
                new ChatParticipant() { ChatId = chat6.Id, PersonId = person7.Id },

                new ChatParticipant() { ChatId = chat7.Id, PersonId = person1.Id },
                new ChatParticipant() { ChatId = chat7.Id, PersonId = person8.Id },

                new ChatParticipant() { ChatId = chat8.Id, PersonId = person2.Id },
                new ChatParticipant() { ChatId = chat8.Id, PersonId = person3.Id },

                new ChatParticipant() { ChatId = chat9.Id, PersonId = person2.Id },
                new ChatParticipant() { ChatId = chat9.Id, PersonId = person4.Id },

                new ChatParticipant() { ChatId = chat10.Id, PersonId = person2.Id },
                new ChatParticipant() { ChatId = chat10.Id, PersonId = person8.Id },

                new ChatParticipant() { ChatId = chat11.Id, PersonId = person3.Id },
                new ChatParticipant() { ChatId = chat11.Id, PersonId = person4.Id },

                new ChatParticipant() { ChatId = chat12.Id, PersonId = person1.Id },
                new ChatParticipant() { ChatId = chat12.Id, PersonId = person2.Id },
                new ChatParticipant() { ChatId = chat12.Id, PersonId = person3.Id },
                new ChatParticipant() { ChatId = chat12.Id, PersonId = person4.Id }
            );

            modelBuilder.Entity<ChatMessage>().HasData(
                new ChatMessage() { ChatId = chat1.Id, SenderId = person2.Id, Status = MessageStatusType.Read, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-224), Text = "Merhaba, projeyle ilgili bir sorum var" },
                new ChatMessage() { ChatId = chat1.Id, SenderId = person1.Id, Status = MessageStatusType.Read, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-223), Text = "Merhaba Ahmet! Tabii, buyurun sorun" },
                new ChatMessage() { ChatId = chat1.Id, SenderId = person2.Id, Status = MessageStatusType.Delivered, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-222), Text = "Tasarım dosyalarını ne zaman paylaşabilirsiniz?" },
                new ChatMessage() { ChatId = chat1.Id, SenderId = person1.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-221), Text = "Bugün sonu itibariyle tüm dosyaları paylaşacağım. PDF ve Figma linklerini göndereceğim." },
                new ChatMessage() { ChatId = chat1.Id, SenderId = person2.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-220), Text = "Harika! Projeyi ne zaman teslim edebiliriz?" },

                new ChatMessage() { ChatId = chat2.Id, SenderId = person3.Id, Status = MessageStatusType.Read, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-131), Text = "Lütfen adamı hasta etmeyelim." },
                new ChatMessage() { ChatId = chat2.Id, SenderId = person1.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-130), Text = "Tabiki efem" },

                new ChatMessage() { ChatId = chat3.Id, SenderId = person4.Id, Status = MessageStatusType.Read, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-32), Text = "Abüzüpler pırızıttı mı?." },
                new ChatMessage() { ChatId = chat3.Id, SenderId = person1.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "Efendim?!" },
                new ChatMessage() { ChatId = chat3.Id, SenderId = person4.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30), Text = "Zıırt Erenköy :)" },

                new ChatMessage() { ChatId = chat4.Id, SenderId = person1.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "Asl pls!" },
                new ChatMessage() { ChatId = chat4.Id, SenderId = person5.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30), Text = "18 f izmir" },

                new ChatMessage() { ChatId = chat5.Id, SenderId = person1.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "Aloo" },
                new ChatMessage() { ChatId = chat5.Id, SenderId = person6.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30), Text = "Ne diyon?" },

                new ChatMessage() { ChatId = chat6.Id, SenderId = person1.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "merhaba" },
                new ChatMessage() { ChatId = chat6.Id, SenderId = person7.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30), Text = "he" },

                new ChatMessage() { ChatId = chat7.Id, SenderId = person1.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "selam" },
                new ChatMessage() { ChatId = chat7.Id, SenderId = person8.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30), Text = "sucuk" },
                new ChatMessage() { ChatId = chat8.Id, SenderId = person2.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "Abuzer" },
                new ChatMessage() { ChatId = chat8.Id, SenderId = person3.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30), Text = "Kadayıf" },
                new ChatMessage() { ChatId = chat9.Id, SenderId = person2.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "1 chat kaç para ulen!?" },
                new ChatMessage() { ChatId = chat9.Id, SenderId = person4.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30), Text = ":)" },
                new ChatMessage() { ChatId = chat10.Id, SenderId = person2.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "Kimsin?" },
                new ChatMessage() { ChatId = chat10.Id, SenderId = person8.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30), Text = "Benim." },
                new ChatMessage() { ChatId = chat11.Id, SenderId = person3.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "???" },
                new ChatMessage() { ChatId = chat11.Id, SenderId = person4.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30), Text = "!!!" },

                new ChatMessage() { ChatId = chat12.Id, SenderId = person1.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "Selam millet" },
                new ChatMessage() { ChatId = chat12.Id, SenderId = person1.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "Naabıyonuz?" },
                new ChatMessage() { ChatId = chat12.Id, SenderId = person1.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "Keyifler gıcır mı?" },
                new ChatMessage() { ChatId = chat12.Id, SenderId = person2.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "Merabayın" },
                new ChatMessage() { ChatId = chat12.Id, SenderId = person2.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "Takılmaca" },
                new ChatMessage() { ChatId = chat12.Id, SenderId = person3.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-31), Text = "Devamke" },
                new ChatMessage() { ChatId = chat12.Id, SenderId = person4.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30), Text = "Lorke lorke..." },
                new ChatMessage() { ChatId = chat12.Id, SenderId = person4.Id, Status = MessageStatusType.Sent, CreatedAt = DateTimeOffset.UtcNow.AddMinutes(-30), Text = "Delalım lorke" }
            );

            var groupSales = new Group() { Name = "Satış Ekibi", Description = "Müşteri satış ve ürün bilgilendirme ekibi", Type = GroupType.Sales, IsActive = true };
            var groupTechnicalSupport = new Group() { Name = "Teknik Destek", Description = "Yazılım ve donanım teknik destek ekibi", Type = GroupType.Technical, IsActive = true };
            var groupCustomerService = new Group() { Name = "Müşteri Hizmetleri", Description = "Genel müşteri şikayet ve talepleri ekibi", Type = GroupType.Support, IsActive = true };
            var groupVip = new Group() { Name = "VIP Destek", Description = "Kurumsal ve premium müşterilere özel destek", Type = GroupType.Specialized, IsActive = true };
            var groupManagement = new Group() { Name = "Call Center Yönetimi", Description = "Takım liderleri ve call center yöneticileri", Type = GroupType.Management, IsActive = true };

            modelBuilder.Entity<Group>().HasData(
                groupSales,
                groupTechnicalSupport,
                groupCustomerService,
                groupVip,
                groupManagement);

            var queueInboundMain = new Queue() { Name = "Gelen_Çağrılar_Ana", Description = "Tüm gelen müşteri çağrıları için ana kuyruk", Type = QueueType.Inbound, Priority = 1, MaxWaitTime = 180, MaxConcurrentCalls = 20, IsActive = true, GroupId = groupCustomerService.Id };
            var queueTechnicalSupport = new Queue() { Name = "Teknik_Destek", Description = "Yazılım ve teknik problemler için özel kuyruk", Type = QueueType.Inbound, Priority = 2, MaxWaitTime = 300, MaxConcurrentCalls = 15, IsActive = true, GroupId = groupTechnicalSupport.Id };
            var queueVipCustomer = new Queue() { Name = "VIP_Müşteriler", Description = "Kurumsal ve premium müşterilere öncelikli kuyruk", Type = QueueType.VIP, Priority = 1, MaxWaitTime = 60, MaxConcurrentCalls = 10, IsActive = true, GroupId = groupVip.Id };
            var queueCallback = new Queue() { Name = "Geri_Arama", Description = "Müşteri taleplerine göre planlanan geri aramalar", Type = QueueType.Callback, Priority = 3, MaxWaitTime = 86400, MaxConcurrentCalls = 5, IsActive = true, GroupId = groupSales.Id };
            var queueOutboundSales = new Queue() { Name = "Satış_Giden_Çağrılar", Description = "Potansiyel müşterilere yapılan satış çağrıları", Type = QueueType.Outbound, Priority = 2, MaxWaitTime = 120, MaxConcurrentCalls = 25, IsActive = true, GroupId = groupSales.Id };
            var queuePrioritySupport = new Queue() { Name = "Öncelikli_Destek", Description = "Kritik ve acil durumlar için öncelikli kuyruk", Type = QueueType.Priority, Priority = 1, MaxWaitTime = 45, MaxConcurrentCalls = 8, IsActive = true, GroupId = groupTechnicalSupport.Id };
            var queueBilling = new Queue() { Name = "Fatura_Ödeme", Description = "Fatura sorgulama ve ödeme problemleri kuyruğu", Type = QueueType.Inbound, Priority = 2, MaxWaitTime = 240, MaxConcurrentCalls = 12, IsActive = true, GroupId = groupCustomerService.Id };

            modelBuilder.Entity<Queue>().HasData(
                queueInboundMain,
                queueTechnicalSupport,
                queueVipCustomer,
                queueCallback,
                queueOutboundSales,
                queuePrioritySupport,
                queueBilling);

            var skillEnglish = new Skill() { Name = "İngilizce", Description = "İngilizce müşteri iletişim yeteneği", Category = SkillCategory.Language, Priority = 1, IsActive = true };
            var skillTechnicalSupport = new Skill() { Name = "Teknik Destek", Description = "Yazılım ve donanım teknik problem çözme yeteneği", Category = SkillCategory.Technical, Priority = 2, IsActive = true };
            var skillSales = new Skill() { Name = "Satış ve İkna", Description = "Müşteri ikna ve ürün satış yeteneği", Category = SkillCategory.Sales, Priority = 1, IsActive = true };
            var skillBilling = new Skill() { Name = "Fatura Sistemi", Description = "Fatura sorgulama ve ödeme sistemleri bilgisi", Category = SkillCategory.Billing, Priority = 2, IsActive = true };
            var skillCrm = new Skill() { Name = "CRM Sistemleri", Description = "Müşteri ilişkileri yönetim sistemleri kullanım bilgisi", Category = SkillCategory.Specialized, Priority = 3, IsActive = true };
            var skillGerman = new Skill() { Name = "Almanca", Description = "Almanca müşteri iletişim yeteneği", Category = SkillCategory.Language, Priority = 2, IsActive = true };
            var skillTurkish = new Skill() { Name = "Türkçe", Description = "Türkçe müşteri iletişim yeteneği", Category = SkillCategory.Language, Priority = 3, IsActive = true };
            var skillNetworkTroubleshooting = new Skill() { Name = "Network Sorun Giderme", Description = "Ağ bağlantı problemlerini çözme yeteneği", Category = SkillCategory.Technical, Priority = 2, IsActive = true };
            var skillSoftwareInstallation = new Skill() { Name = "Yazılım Kurulumu", Description = "Yazılım kurulum ve yapılandırma bilgisi", Category = SkillCategory.Technical, Priority = 3, IsActive = true };
            var skillVipManagement = new Skill() { Name = "VIP Müşteri Yönetimi", Description = "Kurumsal ve premium müşteri ilişkileri yönetimi", Category = SkillCategory.Specialized, Priority = 1, IsActive = true };
            var skillProblemSolving = new Skill() { Name = "Problem Çözme", Description = "Karmaşık müşteri problemlerini analiz etme ve çözme", Category = SkillCategory.Support, Priority = 1, IsActive = true };

            modelBuilder.Entity<Skill>().HasData(
                skillEnglish,
                skillTechnicalSupport,
                skillSales,
                skillBilling,
                skillCrm,
                skillGerman,
                skillTurkish,
                skillNetworkTroubleshooting,
                skillSoftwareInstallation,
                skillVipManagement,
                skillProblemSolving);

            modelBuilder.Entity<Agent>().HasData(
                new Agent() { Id = person1.Id, Status = AgentStatus.Available },
                new Agent() { Id = person2.Id, Status = AgentStatus.Busy },
                new Agent() { Id = person3.Id, Status = AgentStatus.Training},
                new Agent() { Id = person4.Id, Status = AgentStatus.Away },
                new Agent() { Id = person5.Id, Status = AgentStatus.OnBreak },
                new Agent() { Id = person6.Id, Status = AgentStatus.Away },
                new Agent() { Id = person7.Id, Status = AgentStatus.OnBreak },
                new Agent() { Id = person8.Id, }
            );

            modelBuilder.Entity<AgentGroup>().HasData(
                new AgentGroup() { AgentId = person1.Id, GroupId = groupSales.Id },
                new AgentGroup() { AgentId = person1.Id, GroupId = groupTechnicalSupport.Id },
                new AgentGroup() { AgentId = person1.Id, GroupId = groupCustomerService.Id },
                new AgentGroup() { AgentId = person1.Id, GroupId = groupVip.Id },
                new AgentGroup() { AgentId = person1.Id, GroupId = groupManagement.Id },

                new AgentGroup() { AgentId = person2.Id, GroupId = groupSales.Id },
                new AgentGroup() { AgentId = person2.Id, GroupId = groupTechnicalSupport.Id },
                new AgentGroup() { AgentId = person2.Id, GroupId = groupCustomerService.Id },
                new AgentGroup() { AgentId = person2.Id, GroupId = groupVip.Id },
                new AgentGroup() { AgentId = person2.Id, GroupId = groupManagement.Id },

                new AgentGroup() { AgentId = person3.Id, GroupId = groupSales.Id },
                new AgentGroup() { AgentId = person4.Id, GroupId = groupTechnicalSupport.Id },
                new AgentGroup() { AgentId = person5.Id, GroupId = groupCustomerService.Id },
                new AgentGroup() { AgentId = person6.Id, GroupId = groupVip.Id },
                new AgentGroup() { AgentId = person7.Id, GroupId = groupManagement.Id });

            modelBuilder.Entity<AgentSkill>().HasData(
                new AgentSkill() { AgentId = person1.Id, SkillId = skillEnglish.Id, Proficiency = ProficiencyLevel.Advanced, IsPrimary = true },
                new AgentSkill() { AgentId = person2.Id, SkillId = skillEnglish.Id, Proficiency = ProficiencyLevel.Advanced, CertifiedAt = DateTime.UtcNow, IsPrimary = true },
                new AgentSkill() { AgentId = person3.Id, SkillId = skillTechnicalSupport.Id, Proficiency = ProficiencyLevel.Intermediate, CertifiedAt = DateTime.UtcNow.AddMonths(-6) },
                new AgentSkill() { AgentId = person4.Id, SkillId = skillSales.Id, Proficiency = ProficiencyLevel.Beginner, CertifiedAt = DateTime.UtcNow.AddMonths(-3) });

            modelBuilder.Entity<QueueAssignment>().HasData(
                new QueueAssignment() { AgentId = person1.Id, QueueId = queueInboundMain.Id, Priority = 1 },
                new QueueAssignment() { AgentId = person2.Id, QueueId = queueInboundMain.Id, Priority = 1 },
                new QueueAssignment() { AgentId = person3.Id, QueueId = queueInboundMain.Id, Priority = 1 },
                new QueueAssignment() { AgentId = person4.Id, QueueId = queueInboundMain.Id, Priority = 1 },
                new QueueAssignment() { AgentId = person1.Id, QueueId = queueOutboundSales.Id, Priority = 1 },
                new QueueAssignment() { AgentId = person2.Id, QueueId = queueOutboundSales.Id, Priority = 1 },
                new QueueAssignment() { AgentId = person1.Id, QueueId = queueCallback.Id, Priority = 1 },
                new QueueAssignment() { AgentId = person5.Id, QueueId = queueTechnicalSupport.Id, Priority = 1 },
                new QueueAssignment() { AgentId = person6.Id, QueueId = queueVipCustomer.Id, Priority = 1 });

            modelBuilder.Entity<QueueSkill>().HasData(
                new QueueSkill() { QueueId = queueTechnicalSupport.Id, SkillId = skillTechnicalSupport.Id, IsRequired = true, MinimumProficiency = ProficiencyLevel.Intermediate, Weight = 10 },
                //new QueueSkill() { QueueId = queueTechnicalSupport.Id, SkillId = skillTechnicalSupport.Id, IsRequired = false, MinimumProficiency = ProficiencyLevel.Beginner, Weight = 5 },
                new QueueSkill() { QueueId = queueVipCustomer.Id, SkillId = skillVipManagement.Id, IsRequired = true, MinimumProficiency = ProficiencyLevel.Advanced, Weight = 10 },
                new QueueSkill() { QueueId = queueOutboundSales.Id, SkillId = skillSales.Id, IsRequired = false, MinimumProficiency = ProficiencyLevel.Beginner, Weight = 8 });
        }
    }
}
