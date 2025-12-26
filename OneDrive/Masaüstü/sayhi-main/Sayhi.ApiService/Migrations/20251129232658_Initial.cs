using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Sayhi.ApiService.Migrations
{
    /// <inheritdoc />
    public partial class Initial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Chats",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "text", nullable: false),
                    Source = table.Column<int>(type: "integer", nullable: false),
                    Tags = table.Column<string>(type: "TEXT", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Chats", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "People",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Email = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    Password = table.Column<string>(type: "text", nullable: false),
                    PhoneNumber = table.Column<string>(type: "text", nullable: true),
                    AvatarUrl = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_People", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Skills",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Category = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Skills", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Agents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    EmployeeId = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    LastActivityAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Agents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Agents_People_Id",
                        column: x => x.Id,
                        principalTable: "People",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChatId = table.Column<Guid>(type: "uuid", nullable: false),
                    SenderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Text = table.Column<string>(type: "text", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatMessages_Chats_ChatId",
                        column: x => x.ChatId,
                        principalTable: "Chats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatMessages_People_SenderId",
                        column: x => x.SenderId,
                        principalTable: "People",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChatParticipants",
                columns: table => new
                {
                    ChatId = table.Column<Guid>(type: "uuid", nullable: false),
                    PersonId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatParticipants", x => new { x.ChatId, x.PersonId });
                    table.ForeignKey(
                        name: "FK_ChatParticipants_Chats_ChatId",
                        column: x => x.ChatId,
                        principalTable: "Chats",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChatParticipants_People_PersonId",
                        column: x => x.PersonId,
                        principalTable: "People",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AgentSkills",
                columns: table => new
                {
                    AgentId = table.Column<Guid>(type: "uuid", nullable: false),
                    SkillId = table.Column<Guid>(type: "uuid", nullable: false),
                    Proficiency = table.Column<int>(type: "integer", nullable: false),
                    CertifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentSkills", x => new { x.AgentId, x.SkillId });
                    table.ForeignKey(
                        name: "FK_AgentSkills_Agents_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Agents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AgentSkills_Skills_SkillId",
                        column: x => x.SkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Groups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    ManagerId = table.Column<Guid>(type: "uuid", nullable: true),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Groups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Groups_Agents_ManagerId",
                        column: x => x.ManagerId,
                        principalTable: "Agents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "AgentGroup",
                columns: table => new
                {
                    AgentId = table.Column<Guid>(type: "uuid", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AgentGroup", x => new { x.AgentId, x.GroupId });
                    table.ForeignKey(
                        name: "FK_AgentGroup_Agents_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Agents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AgentGroup_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Queues",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    MaxWaitTime = table.Column<int>(type: "integer", nullable: false),
                    MaxConcurrentCalls = table.Column<int>(type: "integer", nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    GroupId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Queues", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Queues_Groups_GroupId",
                        column: x => x.GroupId,
                        principalTable: "Groups",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "QueueAssignments",
                columns: table => new
                {
                    AgentId = table.Column<Guid>(type: "uuid", nullable: false),
                    QueueId = table.Column<Guid>(type: "uuid", nullable: false),
                    UnassignedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                    Priority = table.Column<int>(type: "integer", nullable: false),
                    CallsHandled = table.Column<int>(type: "integer", nullable: false),
                    AverageHandleTime = table.Column<double>(type: "double precision", nullable: false),
                    SatisfactionScore = table.Column<double>(type: "double precision", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QueueAssignments", x => new { x.AgentId, x.QueueId });
                    table.ForeignKey(
                        name: "FK_QueueAssignments_Agents_AgentId",
                        column: x => x.AgentId,
                        principalTable: "Agents",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QueueAssignments_Queues_QueueId",
                        column: x => x.QueueId,
                        principalTable: "Queues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "QueueSkills",
                columns: table => new
                {
                    QueueId = table.Column<Guid>(type: "uuid", nullable: false),
                    SkillId = table.Column<Guid>(type: "uuid", nullable: false),
                    IsRequired = table.Column<bool>(type: "boolean", nullable: false),
                    MinimumProficiency = table.Column<int>(type: "integer", nullable: false),
                    Weight = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_QueueSkills", x => new { x.QueueId, x.SkillId });
                    table.ForeignKey(
                        name: "FK_QueueSkills_Queues_QueueId",
                        column: x => x.QueueId,
                        principalTable: "Queues",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_QueueSkills_Skills_SkillId",
                        column: x => x.SkillId,
                        principalTable: "Skills",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Chats",
                columns: new[] { "Id", "CreatedAt", "Name", "Source", "Tags" },
                values: new object[,]
                {
                    { new Guid("019ad1f0-ea6f-73cf-98ab-e13ad6826924"), new DateTimeOffset(new DateTime(2025, 11, 29, 19, 46, 58, 159, DateTimeKind.Unspecified).AddTicks(243), new TimeSpan(0, 0, 0, 0, 0)), "", 3, "{}" },
                    { new Guid("019ad1f0-ea70-7602-8a24-9da0392a7cba"), new DateTimeOffset(new DateTime(2025, 11, 29, 21, 16, 58, 160, DateTimeKind.Unspecified).AddTicks(7612), new TimeSpan(0, 0, 0, 0, 0)), "", 3, "{\"Order\":0,\"Angry\":3}" },
                    { new Guid("019ad1f0-ea71-702e-9d87-300a3d457bbc"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 46, 58, 161, DateTimeKind.Unspecified).AddTicks(3370), new TimeSpan(0, 0, 0, 0, 0)), "", 3, "{\"Angry\":3}" },
                    { new Guid("019ad1f0-ea71-72c4-80f6-9014ce8bec71"), new DateTimeOffset(new DateTime(2025, 11, 29, 21, 56, 58, 161, DateTimeKind.Unspecified).AddTicks(3205), new TimeSpan(0, 0, 0, 0, 0)), "", 6, "{\"Angry\":3,\"Order\":0}" },
                    { new Guid("019ad1f0-ea71-73e2-93f7-b58f8710269e"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 16, 58, 161, DateTimeKind.Unspecified).AddTicks(3424), new TimeSpan(0, 0, 0, 0, 0)), "", 5, "{}" },
                    { new Guid("019ad1f0-ea71-777b-8f88-c4ab3e59cc82"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 16, 58, 161, DateTimeKind.Unspecified).AddTicks(3305), new TimeSpan(0, 0, 0, 0, 0)), "", 6, "{\"Angry\":3,\"Product\":2}" },
                    { new Guid("019ad1f0-ea71-7a98-9d63-167f301a96fc"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 6, 58, 161, DateTimeKind.Unspecified).AddTicks(3290), new TimeSpan(0, 0, 0, 0, 0)), "", 1, "{\"Angry\":3}" },
                    { new Guid("019ad1f0-ea71-7b3a-964b-67ebdcaf3f2a"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(3615), new TimeSpan(0, 0, 0, 0, 0)), "Bizim Elemanlar", 1, "{\"Order\":0,\"Angry\":3,\"Product\":2}" },
                    { new Guid("019ad1f0-ea71-7c06-bccf-81ded8025c48"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 36, 58, 161, DateTimeKind.Unspecified).AddTicks(3358), new TimeSpan(0, 0, 0, 0, 0)), "", 5, "{\"Product\":2,\"Angry\":3}" },
                    { new Guid("019ad1f0-ea71-7ca7-ba6c-f67be2e3e7ef"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 6, 58, 161, DateTimeKind.Unspecified).AddTicks(3393), new TimeSpan(0, 0, 0, 0, 0)), "", 2, "{\"Order\":0,\"Product\":2}" },
                    { new Guid("019ad1f0-ea71-7e39-8f13-c33ead528198"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(3349), new TimeSpan(0, 0, 0, 0, 0)), "", 3, "{\"Angry\":3}" },
                    { new Guid("019ad1f0-ea71-7fd8-a7bd-fb083e060277"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 56, 58, 161, DateTimeKind.Unspecified).AddTicks(3381), new TimeSpan(0, 0, 0, 0, 0)), "", 5, "{}" }
                });

            migrationBuilder.InsertData(
                table: "Groups",
                columns: new[] { "Id", "CreatedAt", "Description", "IsActive", "ManagerId", "Name", "Type" },
                values: new object[,]
                {
                    { new Guid("019ad1f0-ea71-7681-a705-1620498c3e79"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(6219), new TimeSpan(0, 0, 0, 0, 0)), "Genel müşteri şikayet ve talepleri ekibi", true, null, "Müşteri Hizmetleri", 2 },
                    { new Guid("019ad1f0-ea71-791e-87db-8ab1c436d107"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(6217), new TimeSpan(0, 0, 0, 0, 0)), "Yazılım ve donanım teknik destek ekibi", true, null, "Teknik Destek", 3 },
                    { new Guid("019ad1f0-ea71-792c-be1f-40e14b599af7"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(6221), new TimeSpan(0, 0, 0, 0, 0)), "Takım liderleri ve call center yöneticileri", true, null, "Call Center Yönetimi", 5 },
                    { new Guid("019ad1f0-ea71-7abf-88bb-8df92c9c0674"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(5829), new TimeSpan(0, 0, 0, 0, 0)), "Müşteri satış ve ürün bilgilendirme ekibi", true, null, "Satış Ekibi", 1 },
                    { new Guid("019ad1f0-ea71-7cf2-a6c4-6c7aad75ae42"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(6220), new TimeSpan(0, 0, 0, 0, 0)), "Kurumsal ve premium müşterilere özel destek", true, null, "VIP Destek", 4 }
                });

            migrationBuilder.InsertData(
                table: "People",
                columns: new[] { "Id", "AvatarUrl", "CreatedAt", "Email", "Name", "Password", "PhoneNumber" },
                values: new object[,]
                {
                    { new Guid("00000000-0000-0000-0000-000000000041"), "", new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 157, DateTimeKind.Unspecified).AddTicks(5868), new TimeSpan(0, 0, 0, 0, 0)), "ai@nomail.com", "ai", "C4CA4238A0B923820DCC509A6F75849B", "" },
                    { new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), "https://api.dicebear.com/7.x/avataaars/svg?seed=Gueven", new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 158, DateTimeKind.Unspecified).AddTicks(5759), new TimeSpan(0, 0, 0, 0, 0)), "ozgur.civi@yubis.com", "Güven Çivi", "C4CA4238A0B923820DCC509A6F75849B", "" },
                    { new Guid("019ad1f0-ea6e-775c-a176-e60c9a68542c"), "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmet", new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 158, DateTimeKind.Unspecified).AddTicks(5772), new TimeSpan(0, 0, 0, 0, 0)), "jitewaboh@lagify.com", "Ahmet Yılmaz", "C81E728D9D4C2F636F067F89CC14862C", "" },
                    { new Guid("019ad1f0-ea6e-79c9-a1bb-47c4155b0e9c"), "https://api.dicebear.com/7.x/avataaars/svg?seed=Mehmet", new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 158, DateTimeKind.Unspecified).AddTicks(5765), new TimeSpan(0, 0, 0, 0, 0)), "mehmet.kaya@yubis.com", "Mehmet Kaya", "A87FF679A2F3E71D9181A67B7542122C", "" },
                    { new Guid("019ad1f0-ea6e-79d7-92ee-04f5e95b9edf"), "https://api.dicebear.com/7.x/avataaars/svg?seed=Ayse", new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 158, DateTimeKind.Unspecified).AddTicks(5778), new TimeSpan(0, 0, 0, 0, 0)), "aysed@outlook.com", "Ayşe Demir", "ECCBC87E4B5CE2FE28308FD9F2A7BAF3", "" },
                    { new Guid("019ad1f0-ea6e-7b4f-aca9-16866828051d"), "https://api.dicebear.com/7.x/avataaars/svg?seed=Zeynep", new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 158, DateTimeKind.Unspecified).AddTicks(5812), new TimeSpan(0, 0, 0, 0, 0)), "zeynep.sahin@gmail.com", "Zeynep Şahin", "E4DA3B7FBBCE2345D7772B0674A318D5", "" },
                    { new Guid("019ad1f0-ea6e-7b60-ab5a-8257002ead9f"), "https://api.dicebear.com/7.x/avataaars/svg?seed=Timur", new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 158, DateTimeKind.Unspecified).AddTicks(5737), new TimeSpan(0, 0, 0, 0, 0)), "ozgur_civi@yahoo.com", "Timur Çivi", "C4CA4238A0B923820DCC509A6F75849B", "" },
                    { new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), "https://api.dicebear.com/7.x/avataaars/svg?seed=Mikail", new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 158, DateTimeKind.Unspecified).AddTicks(5728), new TimeSpan(0, 0, 0, 0, 0)), "ozgur.civi@gmail.com", "Mikail Çivi", "C4CA4238A0B923820DCC509A6F75849B", "" },
                    { new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), "https://0.gravatar.com/avatar/b42f914d14fdd06440f626ee2d8e68c5fe4fb4c5f97386ac12ad0267edbcd8fc", new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 158, DateTimeKind.Unspecified).AddTicks(5438), new TimeSpan(0, 0, 0, 0, 0)), "ozgur.civi@outlook.com", "Özgür Çivi", "C4CA4238A0B923820DCC509A6F75849B", "" }
                });

            migrationBuilder.InsertData(
                table: "Skills",
                columns: new[] { "Id", "Category", "CreatedAt", "Description", "IsActive", "Name", "Priority" },
                values: new object[,]
                {
                    { new Guid("019ad1f0-ea71-722f-8c17-1d25e6cc8ec1"), 0, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8100), new TimeSpan(0, 0, 0, 0, 0)), "İngilizce müşteri iletişim yeteneği", true, "İngilizce", 1 },
                    { new Guid("019ad1f0-ea71-742d-9bb7-40d7c3a2985a"), 4, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8599), new TimeSpan(0, 0, 0, 0, 0)), "Karmaşık müşteri problemlerini analiz etme ve çözme", true, "Problem Çözme", 1 },
                    { new Guid("019ad1f0-ea71-7447-83a3-a3be048b964a"), 0, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8573), new TimeSpan(0, 0, 0, 0, 0)), "Almanca müşteri iletişim yeteneği", true, "Almanca", 2 },
                    { new Guid("019ad1f0-ea71-775e-9410-266e890e5549"), 1, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8593), new TimeSpan(0, 0, 0, 0, 0)), "Ağ bağlantı problemlerini çözme yeteneği", true, "Network Sorun Giderme", 2 },
                    { new Guid("019ad1f0-ea71-7850-a6e1-5f682195dc75"), 2, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8562), new TimeSpan(0, 0, 0, 0, 0)), "Müşteri ikna ve ürün satış yeteneği", true, "Satış ve İkna", 1 },
                    { new Guid("019ad1f0-ea71-7936-92c8-536de9a45bc1"), 3, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8570), new TimeSpan(0, 0, 0, 0, 0)), "Fatura sorgulama ve ödeme sistemleri bilgisi", true, "Fatura Sistemi", 2 },
                    { new Guid("019ad1f0-ea71-7a50-badc-7c79c7ea8170"), 0, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8575), new TimeSpan(0, 0, 0, 0, 0)), "Türkçe müşteri iletişim yeteneği", true, "Türkçe", 3 },
                    { new Guid("019ad1f0-ea71-7bb4-aae5-27a8374f29d0"), 1, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8560), new TimeSpan(0, 0, 0, 0, 0)), "Yazılım ve donanım teknik problem çözme yeteneği", true, "Teknik Destek", 2 },
                    { new Guid("019ad1f0-ea71-7c5a-b0c6-219e8b4b9892"), 5, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8572), new TimeSpan(0, 0, 0, 0, 0)), "Müşteri ilişkileri yönetim sistemleri kullanım bilgisi", true, "CRM Sistemleri", 3 },
                    { new Guid("019ad1f0-ea71-7c98-9e6c-0a35cb8e170b"), 1, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8595), new TimeSpan(0, 0, 0, 0, 0)), "Yazılım kurulum ve yapılandırma bilgisi", true, "Yazılım Kurulumu", 3 },
                    { new Guid("019ad1f0-ea71-7eec-be64-0881e762964c"), 5, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8597), new TimeSpan(0, 0, 0, 0, 0)), "Kurumsal ve premium müşteri ilişkileri yönetimi", true, "VIP Müşteri Yönetimi", 1 }
                });

            migrationBuilder.InsertData(
                table: "Agents",
                columns: new[] { "Id", "CreatedAt", "EmployeeId", "LastActivityAt", "Status" },
                values: new object[,]
                {
                    { new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8947), new TimeSpan(0, 0, 0, 0, 0)), null, null, 0 },
                    { new Guid("019ad1f0-ea6e-775c-a176-e60c9a68542c"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8950), new TimeSpan(0, 0, 0, 0, 0)), null, null, 0 },
                    { new Guid("019ad1f0-ea6e-79c9-a1bb-47c4155b0e9c"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8949), new TimeSpan(0, 0, 0, 0, 0)), null, null, 0 },
                    { new Guid("019ad1f0-ea6e-79d7-92ee-04f5e95b9edf"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8953), new TimeSpan(0, 0, 0, 0, 0)), null, null, 0 },
                    { new Guid("019ad1f0-ea6e-7b4f-aca9-16866828051d"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8954), new TimeSpan(0, 0, 0, 0, 0)), null, null, 0 },
                    { new Guid("019ad1f0-ea6e-7b60-ab5a-8257002ead9f"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8946), new TimeSpan(0, 0, 0, 0, 0)), null, null, 0 },
                    { new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8945), new TimeSpan(0, 0, 0, 0, 0)), null, null, 0 },
                    { new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(8942), new TimeSpan(0, 0, 0, 0, 0)), null, null, 0 }
                });

            migrationBuilder.InsertData(
                table: "ChatMessages",
                columns: new[] { "Id", "ChatId", "CreatedAt", "SenderId", "Status", "Text" },
                values: new object[,]
                {
                    { new Guid("019ad1f0-ea71-7050-bc9c-677babb49a22"), new Guid("019ad1f0-ea71-702e-9d87-300a3d457bbc"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5120), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), 1, "Abuzer" },
                    { new Guid("019ad1f0-ea71-70ac-90b7-1988cd0537a8"), new Guid("019ad1f0-ea6f-73cf-98ab-e13ad6826924"), new DateTimeOffset(new DateTime(2025, 11, 29, 19, 42, 58, 161, DateTimeKind.Unspecified).AddTicks(4943), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), 3, "Merhaba, projeyle ilgili bir sorum var" },
                    { new Guid("019ad1f0-ea71-7190-9e54-014febd3ecc9"), new Guid("019ad1f0-ea71-7ca7-ba6c-f67be2e3e7ef"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5135), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), 1, "Kimsin?" },
                    { new Guid("019ad1f0-ea71-71a7-971b-bde29319a12c"), new Guid("019ad1f0-ea71-7a98-9d63-167f301a96fc"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 56, 58, 161, DateTimeKind.Unspecified).AddTicks(5103), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-79c9-a1bb-47c4155b0e9c"), 1, "18 f izmir" },
                    { new Guid("019ad1f0-ea71-71bf-b80a-3e6162444178"), new Guid("019ad1f0-ea71-7ca7-ba6c-f67be2e3e7ef"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 56, 58, 161, DateTimeKind.Unspecified).AddTicks(5139), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7b4f-aca9-16866828051d"), 1, "Benim." },
                    { new Guid("019ad1f0-ea71-71da-8c14-bf4df652c25e"), new Guid("019ad1f0-ea71-7a98-9d63-167f301a96fc"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5078), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), 1, "Asl pls!" },
                    { new Guid("019ad1f0-ea71-71e1-9099-2f61f653e8e1"), new Guid("019ad1f0-ea71-73e2-93f7-b58f8710269e"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 56, 58, 161, DateTimeKind.Unspecified).AddTicks(5143), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), 1, "!!!" },
                    { new Guid("019ad1f0-ea71-725a-9428-0479dd574263"), new Guid("019ad1f0-ea71-702e-9d87-300a3d457bbc"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 56, 58, 161, DateTimeKind.Unspecified).AddTicks(5122), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7b60-ab5a-8257002ead9f"), 1, "Kadayıf" },
                    { new Guid("019ad1f0-ea71-736b-870a-e39cbf214d10"), new Guid("019ad1f0-ea71-73e2-93f7-b58f8710269e"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5141), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7b60-ab5a-8257002ead9f"), 1, "???" },
                    { new Guid("019ad1f0-ea71-7493-8691-fa24b970d04d"), new Guid("019ad1f0-ea71-72c4-80f6-9014ce8bec71"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5066), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), 1, "Efendim?!" },
                    { new Guid("019ad1f0-ea71-7496-b843-f6399e909fcd"), new Guid("019ad1f0-ea70-7602-8a24-9da0392a7cba"), new DateTimeOffset(new DateTime(2025, 11, 29, 21, 15, 58, 161, DateTimeKind.Unspecified).AddTicks(5056), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7b60-ab5a-8257002ead9f"), 3, "Lütfen adamı hasta etmeyelim." },
                    { new Guid("019ad1f0-ea71-7594-9b02-d6f3febab8e0"), new Guid("019ad1f0-ea71-7b3a-964b-67ebdcaf3f2a"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 56, 58, 161, DateTimeKind.Unspecified).AddTicks(5160), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), 1, "Lorke lorke..." },
                    { new Guid("019ad1f0-ea71-7631-be57-185a943db3b4"), new Guid("019ad1f0-ea6f-73cf-98ab-e13ad6826924"), new DateTimeOffset(new DateTime(2025, 11, 29, 19, 43, 58, 161, DateTimeKind.Unspecified).AddTicks(5047), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), 3, "Merhaba Ahmet! Tabii, buyurun sorun" },
                    { new Guid("019ad1f0-ea71-76e4-8702-32088a877f17"), new Guid("019ad1f0-ea71-72c4-80f6-9014ce8bec71"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 54, 58, 161, DateTimeKind.Unspecified).AddTicks(5063), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), 3, "Abüzüpler pırızıttı mı?." },
                    { new Guid("019ad1f0-ea71-7718-a547-9af232b5b4a3"), new Guid("019ad1f0-ea70-7602-8a24-9da0392a7cba"), new DateTimeOffset(new DateTime(2025, 11, 29, 21, 16, 58, 161, DateTimeKind.Unspecified).AddTicks(5058), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), 1, "Tabiki efem" },
                    { new Guid("019ad1f0-ea71-7796-960c-41f385e1204b"), new Guid("019ad1f0-ea71-7c06-bccf-81ded8025c48"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 56, 58, 161, DateTimeKind.Unspecified).AddTicks(5118), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7b4f-aca9-16866828051d"), 1, "sucuk" },
                    { new Guid("019ad1f0-ea71-77c8-ad12-115fb6a1292d"), new Guid("019ad1f0-ea71-7b3a-964b-67ebdcaf3f2a"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 56, 58, 161, DateTimeKind.Unspecified).AddTicks(5162), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), 1, "Delalım lorke" },
                    { new Guid("019ad1f0-ea71-77d6-89e1-c7b716aea03a"), new Guid("019ad1f0-ea71-7e39-8f13-c33ead528198"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5110), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), 1, "merhaba" },
                    { new Guid("019ad1f0-ea71-7a3f-8c71-b382f6c6aca3"), new Guid("019ad1f0-ea71-777b-8f88-c4ab3e59cc82"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5106), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), 1, "Aloo" },
                    { new Guid("019ad1f0-ea71-7a4a-857b-ca9c0fe430cd"), new Guid("019ad1f0-ea6f-73cf-98ab-e13ad6826924"), new DateTimeOffset(new DateTime(2025, 11, 29, 19, 45, 58, 161, DateTimeKind.Unspecified).AddTicks(5052), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), 1, "Bugün sonu itibariyle tüm dosyaları paylaşacağım. PDF ve Figma linklerini göndereceğim." },
                    { new Guid("019ad1f0-ea71-7a5c-85d3-f7bddbe88526"), new Guid("019ad1f0-ea71-7b3a-964b-67ebdcaf3f2a"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5155), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), 1, "Takılmaca" },
                    { new Guid("019ad1f0-ea71-7a65-acfd-a2928a908885"), new Guid("019ad1f0-ea71-7fd8-a7bd-fb083e060277"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5124), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), 1, "1 chat kaç para ulen!?" },
                    { new Guid("019ad1f0-ea71-7ac7-8c0d-82c29797a58c"), new Guid("019ad1f0-ea71-72c4-80f6-9014ce8bec71"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 56, 58, 161, DateTimeKind.Unspecified).AddTicks(5076), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), 1, "Zıırt Erenköy :)" },
                    { new Guid("019ad1f0-ea71-7b4d-8a58-edf0b32b3fcd"), new Guid("019ad1f0-ea71-7b3a-964b-67ebdcaf3f2a"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5148), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), 1, "Naabıyonuz?" },
                    { new Guid("019ad1f0-ea71-7bea-a0bf-80108bc9cb0c"), new Guid("019ad1f0-ea71-7b3a-964b-67ebdcaf3f2a"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5146), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), 1, "Selam millet" },
                    { new Guid("019ad1f0-ea71-7c7f-813f-52e81490723f"), new Guid("019ad1f0-ea71-7e39-8f13-c33ead528198"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 56, 58, 161, DateTimeKind.Unspecified).AddTicks(5114), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-79d7-92ee-04f5e95b9edf"), 1, "he" },
                    { new Guid("019ad1f0-ea71-7c8e-8a8d-305b28083ffb"), new Guid("019ad1f0-ea71-7c06-bccf-81ded8025c48"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5116), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), 1, "selam" },
                    { new Guid("019ad1f0-ea71-7c9f-9058-6fed48e33430"), new Guid("019ad1f0-ea71-7b3a-964b-67ebdcaf3f2a"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5153), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), 1, "Merabayın" },
                    { new Guid("019ad1f0-ea71-7d34-a3f5-702536521292"), new Guid("019ad1f0-ea6f-73cf-98ab-e13ad6826924"), new DateTimeOffset(new DateTime(2025, 11, 29, 19, 46, 58, 161, DateTimeKind.Unspecified).AddTicks(5054), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), 1, "Harika! Projeyi ne zaman teslim edebiliriz?" },
                    { new Guid("019ad1f0-ea71-7df9-90e3-1ac423ce2b9a"), new Guid("019ad1f0-ea71-7fd8-a7bd-fb083e060277"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 56, 58, 161, DateTimeKind.Unspecified).AddTicks(5127), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), 1, ":)" },
                    { new Guid("019ad1f0-ea71-7ec5-bad0-a5591ce83f51"), new Guid("019ad1f0-ea71-7b3a-964b-67ebdcaf3f2a"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5150), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), 1, "Keyifler gıcır mı?" },
                    { new Guid("019ad1f0-ea71-7fe6-82db-8e9f40ff0da4"), new Guid("019ad1f0-ea6f-73cf-98ab-e13ad6826924"), new DateTimeOffset(new DateTime(2025, 11, 29, 19, 44, 58, 161, DateTimeKind.Unspecified).AddTicks(5049), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), 2, "Tasarım dosyalarını ne zaman paylaşabilirsiniz?" },
                    { new Guid("019ad1f0-ea71-7fef-a6ca-9ec2b12312ab"), new Guid("019ad1f0-ea71-7b3a-964b-67ebdcaf3f2a"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 55, 58, 161, DateTimeKind.Unspecified).AddTicks(5158), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-7b60-ab5a-8257002ead9f"), 1, "Devamke" },
                    { new Guid("019ad1f0-ea71-7ff3-948c-955cc543a987"), new Guid("019ad1f0-ea71-777b-8f88-c4ab3e59cc82"), new DateTimeOffset(new DateTime(2025, 11, 29, 22, 56, 58, 161, DateTimeKind.Unspecified).AddTicks(5108), new TimeSpan(0, 0, 0, 0, 0)), new Guid("019ad1f0-ea6e-775c-a176-e60c9a68542c"), 1, "Ne diyon?" }
                });

            migrationBuilder.InsertData(
                table: "ChatParticipants",
                columns: new[] { "ChatId", "PersonId", "CreatedAt" },
                values: new object[,]
                {
                    { new Guid("019ad1f0-ea6f-73cf-98ab-e13ad6826924"), new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4391), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6f-73cf-98ab-e13ad6826924"), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(3976), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea70-7602-8a24-9da0392a7cba"), new Guid("019ad1f0-ea6e-7b60-ab5a-8257002ead9f"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4393), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea70-7602-8a24-9da0392a7cba"), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4392), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-702e-9d87-300a3d457bbc"), new Guid("019ad1f0-ea6e-7b60-ab5a-8257002ead9f"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4402), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-702e-9d87-300a3d457bbc"), new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4401), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-72c4-80f6-9014ce8bec71"), new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4394), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-72c4-80f6-9014ce8bec71"), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4394), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-73e2-93f7-b58f8710269e"), new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4407), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-73e2-93f7-b58f8710269e"), new Guid("019ad1f0-ea6e-7b60-ab5a-8257002ead9f"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4406), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-777b-8f88-c4ab3e59cc82"), new Guid("019ad1f0-ea6e-775c-a176-e60c9a68542c"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4398), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-777b-8f88-c4ab3e59cc82"), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4397), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-7a98-9d63-167f301a96fc"), new Guid("019ad1f0-ea6e-79c9-a1bb-47c4155b0e9c"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4396), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-7a98-9d63-167f301a96fc"), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4395), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-7b3a-964b-67ebdcaf3f2a"), new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4418), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-7b3a-964b-67ebdcaf3f2a"), new Guid("019ad1f0-ea6e-7b60-ab5a-8257002ead9f"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4417), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-7b3a-964b-67ebdcaf3f2a"), new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4416), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-7b3a-964b-67ebdcaf3f2a"), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4415), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-7c06-bccf-81ded8025c48"), new Guid("019ad1f0-ea6e-7b4f-aca9-16866828051d"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4401), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-7c06-bccf-81ded8025c48"), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4400), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-7ca7-ba6c-f67be2e3e7ef"), new Guid("019ad1f0-ea6e-7b4f-aca9-16866828051d"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4405), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-7ca7-ba6c-f67be2e3e7ef"), new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4405), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-7e39-8f13-c33ead528198"), new Guid("019ad1f0-ea6e-79d7-92ee-04f5e95b9edf"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4399), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-7e39-8f13-c33ead528198"), new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4398), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-7fd8-a7bd-fb083e060277"), new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4404), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea71-7fd8-a7bd-fb083e060277"), new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(4403), new TimeSpan(0, 0, 0, 0, 0)) }
                });

            migrationBuilder.InsertData(
                table: "Queues",
                columns: new[] { "Id", "CreatedAt", "Description", "GroupId", "IsActive", "MaxConcurrentCalls", "MaxWaitTime", "Name", "Priority", "Type" },
                values: new object[,]
                {
                    { new Guid("019ad1f0-ea71-7016-8c82-236391c23afb"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(7642), new TimeSpan(0, 0, 0, 0, 0)), "Yazılım ve teknik problemler için özel kuyruk", new Guid("019ad1f0-ea71-791e-87db-8ab1c436d107"), true, 15, 300, "Teknik_Destek", 2, 1 },
                    { new Guid("019ad1f0-ea71-7340-9021-a42838d62798"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(7650), new TimeSpan(0, 0, 0, 0, 0)), "Potansiyel müşterilere yapılan satış çağrıları", new Guid("019ad1f0-ea71-7abf-88bb-8df92c9c0674"), true, 25, 120, "Satış_Giden_Çağrılar", 2, 2 },
                    { new Guid("019ad1f0-ea71-773a-ba44-9e8aac796dbb"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(7648), new TimeSpan(0, 0, 0, 0, 0)), "Müşteri taleplerine göre planlanan geri aramalar", new Guid("019ad1f0-ea71-7abf-88bb-8df92c9c0674"), true, 5, 86400, "Geri_Arama", 3, 3 },
                    { new Guid("019ad1f0-ea71-7788-999c-334468550244"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(7655), new TimeSpan(0, 0, 0, 0, 0)), "Fatura sorgulama ve ödeme problemleri kuyruğu", new Guid("019ad1f0-ea71-7681-a705-1620498c3e79"), true, 12, 240, "Fatura_Ödeme", 2, 1 },
                    { new Guid("019ad1f0-ea71-79ac-968c-e03a1c268a6d"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(7645), new TimeSpan(0, 0, 0, 0, 0)), "Kurumsal ve premium müşterilere öncelikli kuyruk", new Guid("019ad1f0-ea71-7cf2-a6c4-6c7aad75ae42"), true, 10, 60, "VIP_Müşteriler", 1, 5 },
                    { new Guid("019ad1f0-ea71-79e5-9942-6527eabe0b5e"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(6747), new TimeSpan(0, 0, 0, 0, 0)), "Tüm gelen müşteri çağrıları için ana kuyruk", new Guid("019ad1f0-ea71-7681-a705-1620498c3e79"), true, 20, 180, "Gelen_Çağrılar_Ana", 1, 1 },
                    { new Guid("019ad1f0-ea71-7a4c-8ea1-9bfac22cea62"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(7652), new TimeSpan(0, 0, 0, 0, 0)), "Kritik ve acil durumlar için öncelikli kuyruk", new Guid("019ad1f0-ea71-791e-87db-8ab1c436d107"), true, 8, 45, "Öncelikli_Destek", 1, 4 }
                });

            migrationBuilder.InsertData(
                table: "AgentGroup",
                columns: new[] { "AgentId", "GroupId", "CreatedAt" },
                values: new object[,]
                {
                    { new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), new Guid("019ad1f0-ea71-791e-87db-8ab1c436d107"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9361), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6e-775c-a176-e60c9a68542c"), new Guid("019ad1f0-ea71-7cf2-a6c4-6c7aad75ae42"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9363), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6e-79c9-a1bb-47c4155b0e9c"), new Guid("019ad1f0-ea71-7681-a705-1620498c3e79"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9362), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6e-79d7-92ee-04f5e95b9edf"), new Guid("019ad1f0-ea71-792c-be1f-40e14b599af7"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9364), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6e-7b60-ab5a-8257002ead9f"), new Guid("019ad1f0-ea71-7abf-88bb-8df92c9c0674"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9361), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), new Guid("019ad1f0-ea71-7681-a705-1620498c3e79"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9358), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), new Guid("019ad1f0-ea71-791e-87db-8ab1c436d107"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9357), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), new Guid("019ad1f0-ea71-792c-be1f-40e14b599af7"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9360), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), new Guid("019ad1f0-ea71-7abf-88bb-8df92c9c0674"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9349), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), new Guid("019ad1f0-ea71-7cf2-a6c4-6c7aad75ae42"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9359), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new Guid("019ad1f0-ea71-7681-a705-1620498c3e79"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9346), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new Guid("019ad1f0-ea71-791e-87db-8ab1c436d107"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9345), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new Guid("019ad1f0-ea71-792c-be1f-40e14b599af7"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9348), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new Guid("019ad1f0-ea71-7abf-88bb-8df92c9c0674"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9137), new TimeSpan(0, 0, 0, 0, 0)) },
                    { new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new Guid("019ad1f0-ea71-7cf2-a6c4-6c7aad75ae42"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9347), new TimeSpan(0, 0, 0, 0, 0)) }
                });

            migrationBuilder.InsertData(
                table: "AgentSkills",
                columns: new[] { "AgentId", "SkillId", "CertifiedAt", "CreatedAt", "ExpiresAt", "IsPrimary", "Proficiency" },
                values: new object[,]
                {
                    { new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), new Guid("019ad1f0-ea71-7850-a6e1-5f682195dc75"), new DateTime(2025, 8, 29, 23, 26, 58, 162, DateTimeKind.Utc).AddTicks(92), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 162, DateTimeKind.Unspecified).AddTicks(90), new TimeSpan(0, 0, 0, 0, 0)), null, false, 0 },
                    { new Guid("019ad1f0-ea6e-7b60-ab5a-8257002ead9f"), new Guid("019ad1f0-ea71-7bb4-aae5-27a8374f29d0"), new DateTime(2025, 5, 29, 23, 26, 58, 162, DateTimeKind.Utc).AddTicks(29), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 162, DateTimeKind.Unspecified).AddTicks(28), new TimeSpan(0, 0, 0, 0, 0)), null, false, 1 },
                    { new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), new Guid("019ad1f0-ea71-722f-8c17-1d25e6cc8ec1"), new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Utc).AddTicks(9885), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9884), new TimeSpan(0, 0, 0, 0, 0)), null, true, 2 },
                    { new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new Guid("019ad1f0-ea71-722f-8c17-1d25e6cc8ec1"), null, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 161, DateTimeKind.Unspecified).AddTicks(9522), new TimeSpan(0, 0, 0, 0, 0)), null, true, 2 }
                });

            migrationBuilder.InsertData(
                table: "QueueAssignments",
                columns: new[] { "AgentId", "QueueId", "AverageHandleTime", "CallsHandled", "CreatedAt", "Priority", "SatisfactionScore", "UnassignedAt" },
                values: new object[,]
                {
                    { new Guid("019ad1f0-ea6e-700d-b474-234821ff8e2f"), new Guid("019ad1f0-ea71-79e5-9942-6527eabe0b5e"), 0.0, 0, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 162, DateTimeKind.Unspecified).AddTicks(587), new TimeSpan(0, 0, 0, 0, 0)), 1, 0.0, null },
                    { new Guid("019ad1f0-ea6e-775c-a176-e60c9a68542c"), new Guid("019ad1f0-ea71-79ac-968c-e03a1c268a6d"), 0.0, 0, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 162, DateTimeKind.Unspecified).AddTicks(592), new TimeSpan(0, 0, 0, 0, 0)), 1, 0.0, null },
                    { new Guid("019ad1f0-ea6e-79c9-a1bb-47c4155b0e9c"), new Guid("019ad1f0-ea71-7016-8c82-236391c23afb"), 0.0, 0, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 162, DateTimeKind.Unspecified).AddTicks(591), new TimeSpan(0, 0, 0, 0, 0)), 1, 0.0, null },
                    { new Guid("019ad1f0-ea6e-7b60-ab5a-8257002ead9f"), new Guid("019ad1f0-ea71-79e5-9942-6527eabe0b5e"), 0.0, 0, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 162, DateTimeKind.Unspecified).AddTicks(587), new TimeSpan(0, 0, 0, 0, 0)), 1, 0.0, null },
                    { new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), new Guid("019ad1f0-ea71-7340-9021-a42838d62798"), 0.0, 0, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 162, DateTimeKind.Unspecified).AddTicks(589), new TimeSpan(0, 0, 0, 0, 0)), 1, 0.0, null },
                    { new Guid("019ad1f0-ea6e-7c22-a334-7cce1f88f6e2"), new Guid("019ad1f0-ea71-79e5-9942-6527eabe0b5e"), 0.0, 0, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 162, DateTimeKind.Unspecified).AddTicks(585), new TimeSpan(0, 0, 0, 0, 0)), 1, 0.0, null },
                    { new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new Guid("019ad1f0-ea71-7340-9021-a42838d62798"), 0.0, 0, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 162, DateTimeKind.Unspecified).AddTicks(588), new TimeSpan(0, 0, 0, 0, 0)), 1, 0.0, null },
                    { new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new Guid("019ad1f0-ea71-773a-ba44-9e8aac796dbb"), 0.0, 0, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 162, DateTimeKind.Unspecified).AddTicks(590), new TimeSpan(0, 0, 0, 0, 0)), 1, 0.0, null },
                    { new Guid("019ad1f0-ea6e-7f91-8183-e46e9d5ec70a"), new Guid("019ad1f0-ea71-79e5-9942-6527eabe0b5e"), 0.0, 0, new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 162, DateTimeKind.Unspecified).AddTicks(297), new TimeSpan(0, 0, 0, 0, 0)), 1, 0.0, null }
                });

            migrationBuilder.InsertData(
                table: "QueueSkills",
                columns: new[] { "QueueId", "SkillId", "CreatedAt", "IsRequired", "MinimumProficiency", "Weight" },
                values: new object[,]
                {
                    { new Guid("019ad1f0-ea71-7016-8c82-236391c23afb"), new Guid("019ad1f0-ea71-7bb4-aae5-27a8374f29d0"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 162, DateTimeKind.Unspecified).AddTicks(796), new TimeSpan(0, 0, 0, 0, 0)), true, 1, 10 },
                    { new Guid("019ad1f0-ea71-7340-9021-a42838d62798"), new Guid("019ad1f0-ea71-7850-a6e1-5f682195dc75"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 162, DateTimeKind.Unspecified).AddTicks(1265), new TimeSpan(0, 0, 0, 0, 0)), false, 0, 8 },
                    { new Guid("019ad1f0-ea71-79ac-968c-e03a1c268a6d"), new Guid("019ad1f0-ea71-7eec-be64-0881e762964c"), new DateTimeOffset(new DateTime(2025, 11, 29, 23, 26, 58, 162, DateTimeKind.Unspecified).AddTicks(1263), new TimeSpan(0, 0, 0, 0, 0)), true, 2, 10 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AgentGroup_GroupId",
                table: "AgentGroup",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Agents_EmployeeId",
                table: "Agents",
                column: "EmployeeId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AgentSkills_SkillId",
                table: "AgentSkills",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ChatId",
                table: "ChatMessages",
                column: "ChatId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_SenderId",
                table: "ChatMessages",
                column: "SenderId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatParticipants_PersonId",
                table: "ChatParticipants",
                column: "PersonId");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_ManagerId",
                table: "Groups",
                column: "ManagerId");

            migrationBuilder.CreateIndex(
                name: "IX_Groups_Name",
                table: "Groups",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Groups_Type",
                table: "Groups",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_People_Email",
                table: "People",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_QueueAssignments_QueueId",
                table: "QueueAssignments",
                column: "QueueId");

            migrationBuilder.CreateIndex(
                name: "IX_Queues_GroupId",
                table: "Queues",
                column: "GroupId");

            migrationBuilder.CreateIndex(
                name: "IX_Queues_Name",
                table: "Queues",
                column: "Name",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Queues_Type",
                table: "Queues",
                column: "Type");

            migrationBuilder.CreateIndex(
                name: "IX_QueueSkills_SkillId",
                table: "QueueSkills",
                column: "SkillId");

            migrationBuilder.CreateIndex(
                name: "IX_Skills_Category",
                table: "Skills",
                column: "Category");

            migrationBuilder.CreateIndex(
                name: "IX_Skills_Name",
                table: "Skills",
                column: "Name",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AgentGroup");

            migrationBuilder.DropTable(
                name: "AgentSkills");

            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "ChatParticipants");

            migrationBuilder.DropTable(
                name: "QueueAssignments");

            migrationBuilder.DropTable(
                name: "QueueSkills");

            migrationBuilder.DropTable(
                name: "Chats");

            migrationBuilder.DropTable(
                name: "Queues");

            migrationBuilder.DropTable(
                name: "Skills");

            migrationBuilder.DropTable(
                name: "Groups");

            migrationBuilder.DropTable(
                name: "Agents");

            migrationBuilder.DropTable(
                name: "People");
        }
    }
}
