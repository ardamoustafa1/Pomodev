using Microsoft.OpenApi;

namespace Sayhi.ApiService.Data
{
    public static class SwaggerExtensions
    {
        public static IServiceCollection AddSwagger(this IServiceCollection services)
        {
            return services.AddSwaggerGen(options =>
            {
                options.SwaggerDoc("v1", new OpenApiInfo()
                {
                    Title = "SayHi API",
                    Version = "v1"
                });

                options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme()
                {
                    Name = "Authorization",
                    Type = SecuritySchemeType.Http,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = ParameterLocation.Header,
                    Description = "JWT Authorization header using the Bearer scheme. Example: \"Bearer {token}\""
                });

                /*
                options.AddSecurityRequirement(new OpenApiSecurityRequirement()
                    {
                        {
                            new OpenApiSecurityScheme()
                            {
                                //Reference = new OpenApiReference()
                                //{
                                //    Type = ReferenceType.SecurityScheme,
                                //    Id = "Bearer"
                                //},
                                Scheme = "bearer",
                                Name = "Bearer",
                                In = ParameterLocation.Header
                            },
                            Array.Empty<string>()
                        }
                    });
                */
                /*
                options.AddSecurityRequirement((document) => new OpenApiSecurityRequirement()
                {
                    [new OpenApiSecuritySchemeReference("oauth2", document)] = ["readAccess", "writeAccess"]
                });
                */
            });
        }
    }
}
