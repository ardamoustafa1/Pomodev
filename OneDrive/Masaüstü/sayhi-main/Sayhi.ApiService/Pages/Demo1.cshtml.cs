namespace Sayhi.ApiService.Pages
{
    public class Demo1Model(
        IWebHostEnvironment env,
        IConfiguration config
        //Logger<Demo1Model> logger
        ) : BasePageModel(env, config)
    {
        public void OnGet()
        {
            Initialize();
        }
    }
}
