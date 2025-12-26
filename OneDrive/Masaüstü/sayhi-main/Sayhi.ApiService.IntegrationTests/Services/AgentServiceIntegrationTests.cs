using Microsoft.Extensions.DependencyInjection;
using Sayhi.ApiService.IntegrationTests.Setup;
using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Requests;
using Sayhi.ApiService.Services;
using Sayhi.Model;

namespace Sayhi.ApiService.IntegrationTests.Services
{
    [Collection("DatabaseCollection")]
    public class AgentServiceIntegrationTests : BaseDbIntegrationTests
    {
        public AgentServiceIntegrationTests(
            ///PostgreSqlAppDbContainerFixture fixture,
            CustomWebApplicationFactory factory)
            : base(factory)
        {
        }

        [Fact]
        public async Task CrearteAgent_Works()
        {
            Guid id = Guid.NewGuid();
            AgentRequest request = new AgentRequest(
                id,
                "Deneme",
                "text@nomail.com",
                "1",
                "+905369585832",
                $"https://api.dicebear.com/7.x/avataaars/svg?seed={"Deneme"}",
                null,
                null);

            //var agentService = app.Services.GetRequiredService<IAgentService>();
            using var scope = factory.Services.CreateScope();
            var agentService = scope.ServiceProvider.GetService<IAgentService>();

            // Act
            AgentDto? result = await agentService.Add(request);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(id, result.Id);
            Assert.Equal(request.Name, result.Name);
            Assert.Equal(request.Email, result.Email);
            Assert.Equal(request.PhoneNumber, result.PhoneNumber);
            Assert.Equal(request.AvatarUrl, result.AvatarUrl);
            Assert.Equal(AgentStatus.Available, result.Status);
        }

        [Fact]
        public async Task SetAgentStatus_WithRealDb_UpdatesAgentStatus()
        {
            //using var scope = _factory.Services.CreateScope();
            //var provider = scope.ServiceProvider;
            //var context = provider.GetRequiredService<AppDbContext>();

            //using AppDbContext db = CreateContext();

            Guid id = Guid.NewGuid();
            AgentRequest request = new AgentRequest(
                id,
                "Deneme",
                "text@nomail.com",
                "1",
                "+905369585832",
                $"https://api.dicebear.com/7.x/avataaars/svg?seed={"Deneme"}",
                null,
                null);

            using var scope = factory.Services.CreateScope();
            var agentService = scope.ServiceProvider.GetService<IAgentService>();

            // Act
            await agentService.Add(request);
            bool result = await agentService.SetAgentStatus(id, AgentStatus.OnBreak);

            // Assert
            Assert.True(result, "SetAgentStatus should return true for existing agent");
            //var updated = await context.Agents.FindAsync(agentId);
            //Assert.NotNull(updated);
            //Assert.Equal(AgentStatus.Available, updated!.Status);
            //Assert.NotNull(updated.LastActivityAt);
        }
    }
}
