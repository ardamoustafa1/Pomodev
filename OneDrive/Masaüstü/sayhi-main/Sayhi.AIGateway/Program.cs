using Sayhi.AIGateway;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

/// Razor
//builder.Services
//    .AddRazorComponents()
//    .AddInteractiveServerComponents();

/// Web API
builder.Services.AddControllers();
builder.Services.AddSwaggerGen();
//builder.Services.AddOpenApi();

builder.AddAI();

//builder.Services.AddOutputCache();

//builder.Services.AddHttpClient<WeatherApiClient>(client =>
//    {
//        // This URL uses "https+http://" to indicate HTTPS is preferred over HTTP.
//        // Learn more about service discovery scheme resolution at https://aka.ms/dotnet/sdschemes.
//        client.BaseAddress = new("https+http://apiservice");
//    });

//builder.Services.AddSignalR();

//builder.Services.AddCors(options =>
//{
//    options.AddDefaultPolicy(policy =>
//    {
//        policy.WithOrigins("http://localhost:5173") // Vite default port
//              .AllowAnyHeader()
//              .AllowAnyMethod()
//              .AllowCredentials();
//    });
//});

var app = builder.Build();

await app.UseAI();

/// Web API
app.MapDefaultEndpoints();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
    //app.MapOpenApi();
}

app.UseHttpsRedirection();

/// Razor
//app.UseAntiforgery();
//app.UseStaticFiles();

//app.UseOutputCache();

app.UseAuthorization();

/// Razor
//app.MapRazorComponents<App>()
//    .AddInteractiveServerRenderMode();

/// Web API
app.MapControllers();

//app.UseRouting();
//app.UseCors();
//app.MapHub<ChatHub>("/chatHub");

app.Run();
