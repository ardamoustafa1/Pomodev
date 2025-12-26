using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace Sayhi.ApiService.Pages
{
    public class HomeModel(ILogger<HomeModel> logger) : PageModel
    {
        public void OnGet()
        {
        }
    }
}
