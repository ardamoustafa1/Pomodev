using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Moq;
using Xunit;
using Sayhi.ApiService.Services;
using Sayhi.ApiService.Repositories;
using Sayhi.ApiService.Models;
using Sayhi.ApiService.Models.DTOs;
using Sayhi.ApiService.Models.Requests;
using Sayhi.ApiService.Models;
using Sayhi.Model;

namespace Sayhi.ApiService.Tests.Services
{
    public class AgentServiceTests
    {
        [Fact]
        public async Task Add_CallsPersonRepository_And_ReturnsMappedAgentDto()
        {
            // Arrange
            var mockAgentRepo = new Mock<IAgentRepository>();
            var mockPersonRepo = new Mock<IPersonRepository>();
            var mockMapper = new Mock<IMapper>();
            var mockValidator = new Mock<IValidator>();
            var mockLogger = new Mock<ILogger<AgentService>>();

            var request = new AgentRequest(Guid.NewGuid(), "Name", "email@test.local", "pwd", "phone", "avatar", "empid", null);

            var createdPerson = new Person
            {
                Id = Guid.Parse("00000000-0000-0000-0000-000000000120"),
                Email = "ozgur.civi@outlook.com",
                Name = "Özgür Çivi",
                Password = "hashed",
                AvatarUrl = "https://avatar"
            };

            mockPersonRepo
                .Setup(r => r.Add(It.IsAny<Person>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(createdPerson);

            mockValidator
                .Setup(v => v.Validate(It.IsAny<AgentRequest>(), It.IsAny<CancellationToken>()))
                .Returns(Task.CompletedTask);

            var domainAgent = new Agent
            {
                Id = request.Id,
                Person = createdPerson,
                Status = AgentStatus.Available
            };

            mockMapper
                .Setup(m => m.RequestToDomain<Guid, Agent, AgentRequest>(It.IsAny<AgentRequest>()))
                .Returns(domainAgent);

            mockAgentRepo
                .Setup(r => r.Add(It.IsAny<Agent>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(domainAgent);

            var expectedDto = new AgentDto
            {
                Id = domainAgent.Id,
                Name = domainAgent.Name,
                Email = domainAgent.Email
            };

            mockMapper
                .Setup(m => m.DomainToDto<Guid, Agent, AgentDto>(It.IsAny<Agent>()))
                .Returns(expectedDto);

            var service = new AgentService(
                mockAgentRepo.Object,
                mockPersonRepo.Object,
                mockMapper.Object,
                mockValidator.Object,
                mockLogger.Object);

            // Act
            var result = await service.Add(request, CancellationToken.None);

            // Assert
            Assert.NotNull(result);
            Assert.Equal(expectedDto.Id, result.Id);
            Assert.Equal(expectedDto.Email, result.Email);
            mockPersonRepo.Verify(r => r.Add(It.IsAny<Person>(), It.IsAny<CancellationToken>()), Times.Once);
            mockAgentRepo.Verify(r => r.Add(It.IsAny<Agent>(), It.IsAny<CancellationToken>()), Times.Once);
            mockMapper.Verify(m => m.DomainToDto<Guid, Agent, AgentDto>(It.IsAny<Agent>()), Times.Once);
        }

        [Fact]
        public async Task SetAgentStatus_AgentNotFound_ReturnsFalse()
        {
            // Arrange
            var mockAgentRepo = new Mock<IAgentRepository>();
            var mockPersonRepo = new Mock<IPersonRepository>();
            var mockMapper = new Mock<IMapper>();
            var mockValidator = new Mock<IValidator>();
            var mockLogger = new Mock<ILogger<AgentService>>();

            var agentId = Guid.NewGuid();

            mockAgentRepo
                .Setup(r => r.GetById(agentId, It.IsAny<CancellationToken>()))
                .ReturnsAsync((Agent?)null);

            var service = new AgentService(
                mockAgentRepo.Object,
                mockPersonRepo.Object,
                mockMapper.Object,
                mockValidator.Object,
                mockLogger.Object);

            // Act
            var result = await service.SetAgentStatus(agentId, AgentStatus.Away, CancellationToken.None);

            // Assert
            Assert.False(result);
            mockAgentRepo.Verify(r => r.Update(It.IsAny<Agent>(), It.IsAny<CancellationToken>()), Times.Never);
        }

        [Fact]
        public async Task SetAgentStatus_AgentFound_UpdatesStatusAndReturnsTrue()
        {
            // Arrange
            var mockAgentRepo = new Mock<IAgentRepository>();
            var mockPersonRepo = new Mock<IPersonRepository>();
            var mockMapper = new Mock<IMapper>();
            var mockValidator = new Mock<IValidator>();
            var mockLogger = new Mock<ILogger<AgentService>>();

            var agentId = Guid.NewGuid();

            var existingAgent = new Agent
            {
                Id = agentId,
                Person = new Person { Id = Guid.NewGuid(), Email = "a@b" },
                Status = AgentStatus.Away
            };

            mockAgentRepo
                .Setup(r => r.GetById(agentId, It.IsAny<CancellationToken>()))
                .ReturnsAsync(existingAgent);

            mockAgentRepo
                .Setup(r => r.Update(It.IsAny<Agent>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync(1);

            var service = new AgentService(
                mockAgentRepo.Object,
                mockPersonRepo.Object,
                mockMapper.Object,
                mockValidator.Object,
                mockLogger.Object);

            // Act
            var result = await service.SetAgentStatus(agentId, AgentStatus.Available, CancellationToken.None);

            // Assert
            Assert.True(result);
            mockAgentRepo.Verify(r => r.GetById(agentId, It.IsAny<CancellationToken>()), Times.Once);
            mockAgentRepo.Verify(r => r.Update(It.Is<Agent>(a => a.Status == AgentStatus.Available && a.Id == agentId), It.IsAny<CancellationToken>()), Times.Once);
        }
    }
}