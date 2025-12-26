using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Sayhi.ApiService.Pages
{
    public class BasePageModel(
        IWebHostEnvironment env,
        IConfiguration config) : PageModel
    {
        public bool IsDevelopment { get; set; }
        public string BaseUrl { get; set; } = "";

        public void Initialize()
        {
            IsDevelopment = env.IsDevelopment();
            BaseUrl = config["Settings:BaseUrl"] ?? "";
        }
    }
}
