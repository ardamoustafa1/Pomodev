namespace Sayhi.ApiService.Clients
{
    public class AIGatewayApiClient(HttpClient httpClient)
    {
        public async Task<string> Ask(Guid chatId, string input)
        {
            var response = await httpClient.GetAsync($"api/chat/{chatId}/ask/{input}");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadAsStringAsync();
        }

        public async Task<string[]> GetSuggestions(Guid chatId)
        {
            //var response = await httpClient.GetAsync("api/chat/suggestions");
            var response = await httpClient.GetAsync($"api/chat/{chatId}/suggestions");
            //var response = await httpClient.GetAsync($"api/chat/{chatId}/messages/{messageId}/suggestions");
            response.EnsureSuccessStatusCode();
            return await response.Content.ReadFromJsonAsync<string[]>() ?? [];
        }
    }
}
