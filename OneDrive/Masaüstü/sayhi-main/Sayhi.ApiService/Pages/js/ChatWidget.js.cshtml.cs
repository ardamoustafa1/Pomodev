namespace Sayhi.ApiService.Pages.js
{
    public class ChatWidgetJsModel(
        IWebHostEnvironment env,
        IConfiguration config
        //ILogger<ChatWidgetJsModel> logger
        ) : BasePageModel(env, config)
    {
        public void OnGet()
        {
            Initialize();
        }
    }
}
