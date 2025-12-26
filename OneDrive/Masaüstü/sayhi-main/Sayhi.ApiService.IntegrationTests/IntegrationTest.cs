using Microsoft.AspNetCore.Mvc.Testing;
using Sayhi.ApiService.IntegrationTests.Setup;

namespace Sayhi.ApiService.IntegrationTests
{
    /*
    [Collection("IntegrationTests")]
    public class BlogControllerTests : IClassFixture<CustomWebApplicationFactory<Program>>
    {
        private readonly HttpClient _client;
        private readonly CustomWebApplicationFactory<Program> _factory;

        public BlogControllerTests(CustomWebApplicationFactory<Program> factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetBlogs_ShouldReturnEmptyList_WhenNoBlogs()
        {
            // Act
            var response = await _client.GetAsync("/api/blogs");

            // Assert
            response.EnsureSuccessStatusCode();
            var content = await response.Content.ReadAsStringAsync();
            Assert.Contains("[]", content); // Boş liste döner
        }

        [Fact]
        public async Task PostBlog_ShouldAddBlog_ToDatabase()
        {
            // Arrange: Doğrudan DbContext ile veri ekle (aynı container kullanıldığı için görünür)
            await using var scope = _factory.Services.CreateAsyncScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

            db.Blogs.Add(new Blog { Title = "Integration Test Blog" });
            await db.SaveChangesAsync();

            // Act
            var response = await _client.GetAsync("/api/blogs");

            // Assert
            response.EnsureSuccessStatusCode();
            var blogs = await response.Content.ReadFromJsonAsync<List<Blog>>();
            Assert.Contains(blogs, b => b.Title == "Integration Test Blog");
        }
    }
    */

    [Collection("DatabaseCollection")]
    public class IntegrationTest : BaseDbIntegrationTests
    {
        public IntegrationTest(
            CustomWebApplicationFactory factory)
            : base(factory)
        {
        }

        [Fact]
        public async Task Should_return_weather_forecast_on_http_get()
        {
            var client = factory.CreateClient();

            var response = await client.GetAsync("/WeatherForecast");

            response.EnsureSuccessStatusCode();
        }
    }
}
