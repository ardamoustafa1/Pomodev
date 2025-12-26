namespace Sayhi.ApiService.Pages
{
    public class Demo2Model(
        IWebHostEnvironment env,
        IConfiguration config
        //ILogger<Demo2Model> logger
        ) : BasePageModel(env, config)
    {
        public void OnGet()
        {
            Initialize();
        }
    }
}
