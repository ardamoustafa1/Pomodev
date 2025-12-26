using System.Reflection;

namespace Sayhi.ApiService.Data
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection RegisterRepositories(this IServiceCollection services, Assembly? assembly = null)
        {
            assembly ??= Assembly.GetExecutingAssembly();

            Register(services, assembly, "Repository");

            return services;
        }

        public static IServiceCollection RegisterServices(this IServiceCollection services, Assembly? assembly = null)
        {
            assembly ??= Assembly.GetExecutingAssembly();

            Register(services, assembly, "Service");

            return services;
        }

        private static void Register(IServiceCollection services, Assembly assembly, string endsWith)
        {
            Type[] repositoryTypes = assembly
                .GetTypes()
                .Where(t => t.IsClass && !t.IsAbstract && t.Name.EndsWith(endsWith))
                .ToArray();

            foreach (Type classType in repositoryTypes)
            {
                Type? interfaceType = classType.GetInterfaces().FirstOrDefault(i => i.Name == $"I{classType.Name}");

                if (interfaceType != null)
                {
                    services.AddScoped(interfaceType, classType);
                }
            }
        }
    }
}