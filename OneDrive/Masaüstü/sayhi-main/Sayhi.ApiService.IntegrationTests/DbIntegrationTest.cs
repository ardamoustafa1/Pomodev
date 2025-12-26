using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Sayhi.ApiService.Data;
using Sayhi.ApiService.IntegrationTests.Setup;
using Sayhi.Model;

namespace Sayhi.ApiService.IntegrationTests
{
    [Collection("DatabaseCollection")]
    public class DbIntegrationTest : BaseDbIntegrationTests
    {
        public DbIntegrationTest(
            //PostgreSqlAppDbContainerFixture fixture,
            CustomWebApplicationFactory factory)
            : base(factory)
        {
        }

        [Fact]
        public async Task ShouldInsertPerson()
        {
            // Arrange

            using AppDbContext db = CreateChatDbContext();

            Guid id = Guid.NewGuid();
            Person person = new Person()
            {
                Id = id,
                Email = "text@nomail.com",
                Name = "Deneme",
                Password = Utils.Hash("1"),
                AvatarUrl = $"https://api.dicebear.com/7.x/avataaars/svg?seed={"Deneme"}",
                PhoneNumber = "+905369585832"
            };

            // Act
            db.People.Add(person);
            int numberOfRows = await db.SaveChangesAsync();

            Person? foundPerson = await db.People
                //.Include(i => i.Posts)
                .FirstOrDefaultAsync(i => i.Id == id);

            // Assert
            Assert.Equal(1, numberOfRows);
            Assert.NotNull(foundPerson);
            //Assert.Single(foundBlog.Posts);
            Assert.Equal(person.Name, foundPerson.Name);
            Assert.Equal(person.Password, foundPerson.Password);
        }
    }
}
