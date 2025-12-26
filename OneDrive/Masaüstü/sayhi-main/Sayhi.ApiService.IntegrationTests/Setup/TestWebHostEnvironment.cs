using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Hosting;

namespace Sayhi.ApiService.IntegrationTests.Setup
{
    internal sealed class TestWebHostEnvironment : IWebHostEnvironment
    {
        public string EnvironmentName { get; set; } = Environments.Development;
        public string ApplicationName { get; set; } = "Sayhi.IntegrationTests";
        public string ContentRootPath { get; set; } = Directory.GetCurrentDirectory();
        public IFileProvider? ContentRootFileProvider { get; set; }
        public string WebRootPath { get; set; } = Directory.GetCurrentDirectory();
        public IFileProvider? WebRootFileProvider { get; set; }
    }
}
