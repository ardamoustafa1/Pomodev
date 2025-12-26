using System.Reflection;
using Concordia.MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Sayhi.ApiService.Clients;
using Sayhi.ApiService.Data;
using Sayhi.ApiService.Extensions;
using Sayhi.ApiService.Features.Chat;
using Sayhi.ApiService.Hubs;
using Sayhi.ApiService.Models;
using Sayhi.ApiService.Repositories.Cached;
using Sayhi.Providers.WhatsApp;

var builder = WebApplication.CreateBuilder(args);

builder.AddServiceDefaults();

builder.Services.AddProblemDetails();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwagger();
//builder.Services.AddOpenApi();

builder.Services.AddRazorPages();

builder.Services.AddSignalR();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            //.WithOrigins("http://localhost:5173") // Vite default port
            //.WithOrigins("")
            //.AllowAnyOrigin()
            .SetIsOriginAllowed(_ => true)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwt(builder.Configuration);
builder.Services.AddAuthorization();

//builder.AddSqliteDbContext<AppDbContext>();
builder.AddPostgresDbContext<AppDbContext>("db-chat");
builder.AddPostgresDbContext<ReportingDbContext>("db-report");

builder.Services.AddScoped<IMapper, Mapper>();
builder.Services.AddScoped<IValidator, Validator>();
builder.Services.RegisterRepositories();
builder.Services.AddScoped<ChatCachedRepository>();
builder.Services.AddScoped<ChatCacheSearchRepository>();
builder.Services.AddScoped<PersonCachedRepository>();
builder.Services.RegisterServices();
//builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<WhatsAppCloudApiProvider>();

builder.Services.AddScoped<IDashboardCache, DashboardCache>();

builder.Services.AddMediator(cfg =>
{
    cfg.RegisterServicesFromAssembly(Assembly.GetExecutingAssembly());
    cfg.Lifetime = ServiceLifetime.Scoped;
});

builder.Services.AddHttpClient<AIGatewayApiClient>(client =>
{
    // This URL uses "https+http://" to indicate HTTPS is preferred over HTTP.
    // Learn more about service discovery scheme resolution at https://aka.ms/dotnet/sdschemes.
    client.BaseAddress = new Uri(builder.Configuration["AIGatewayApi:Url"]!);
    client.DefaultRequestHeaders.Add("Accept", "application/json");
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
    //app.MapOpenApi();
}
else
{
    app.UseExceptionHandler("/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

//app.UseHttpsRedirection();
//app.UseRouting();

app.UseExceptionHandler();

app.MapDefaultEndpoints();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/chatHub");
app.UseStaticFiles();
app.MapStaticAssets();
app.MapRazorPages()
   .WithStaticAssets();
app.MapFallbackToFile("index.html");

//app.UseSqlite();
app.UsePostgres<AppDbContext>();
app.UsePostgres<ReportingDbContext>();

app.Run();
