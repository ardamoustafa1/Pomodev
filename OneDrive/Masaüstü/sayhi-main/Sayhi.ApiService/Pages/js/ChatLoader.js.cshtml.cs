namespace Sayhi.ApiService.Pages.js
{
    public class ChatLoaderJsModel(
        IWebHostEnvironment env,
        IConfiguration config
        //ILogger<ChatLoaderJsModel> logger
        ) : BasePageModel(env, config)
    {
        public void OnGet()
        {
            Initialize();
        }
    }
}
