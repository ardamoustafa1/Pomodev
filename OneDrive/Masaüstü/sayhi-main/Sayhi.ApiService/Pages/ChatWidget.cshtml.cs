using Microsoft.AspNetCore.Mvc;

namespace Sayhi.ApiService.Pages
{
    public class ChatWidgetModel(
        IWebHostEnvironment env,
        IConfiguration config,
        ILogger<ChatWidgetModel> logger) : BasePageModel(env, config)
    {
        [BindProperty]
        public string? ApiKey { get; set; }

        public IActionResult OnGet(string? apiKey)
        {
            if (string.IsNullOrEmpty(apiKey))
            {
                return Forbid();
            }

            if (!IsValidApiKey(apiKey))
            {
                logger.LogWarning($"Invalid API-Key: {apiKey}");
                return Forbid();
            }

            ApiKey = apiKey;

            Initialize();

            return Page();
        }

        private bool IsValidApiKey(string apiKey)
        {
            string[] validKeys = [ "DEMO-KEY-12345", "CLIENT-ABC-67890"];

            return validKeys.Contains(apiKey);
        }
    }
}
