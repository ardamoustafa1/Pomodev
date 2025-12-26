using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Sayhi.ApiService.Clients;
using Sayhi.ApiService.Models;

namespace Sayhi.ApiService.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("api/[controller]")]
    public class PublicChatController(
        AIGatewayApiClient aiApiClient,
        ILogger<PublicChatController> logger
        //IConfiguration configuration
        ) : ControllerBase
    {
        [HttpGet("lo")]
        public async Task<IActionResult> Lo(Guid chatId, string input)
        {
            string result = await aiApiClient.Ask(chatId, input);
            return Ok(result);
        }

        [HttpPost("send")]
        public async Task<IActionResult> SendMessage([FromBody] PublicChatMessageRequest request)
        {
            // Sunucu tarafı validasyon
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Site key kontrolü
            if (!IsValidSiteKey(request.SiteKey))
            {
                logger.LogWarning($"Geçersiz site key: {request.SiteKey}");
                return Unauthorized();
            }

            // Rate limiting kontrolü
            if (!CheckRateLimit(request.SiteKey))
            {
                return StatusCode(429, "Çok fazla istek. Lütfen bekleyin.");
            }

            // Mesajı veritabanına kaydet
            await SaveMessageToDatabase(request.SiteKey, request.Message);

            // Bot yanıtı oluştur (burada AI/ML servisi entegre edilebilir)
            var reply = GenerateBotReply(request.Message);

            return Ok(new { reply });
        }

        private bool IsValidSiteKey(string siteKey)
        {
            // Veritabanından kontrol
            var validKeys = new[] { "DEMO-KEY-12345", "CLIENT-ABC-67890" };
            return validKeys.Contains(siteKey);
        }

        private bool CheckRateLimit(string siteKey)
        {
            // Rate limiting mantığı (Redis, MemoryCache vb.)
            // Örnek: Dakikada 20 mesaj limiti
            return true;
        }

        private async Task SaveMessageToDatabase(string siteKey, string message)
        {
            // Veritabanına kaydetme işlemi
            logger.LogInformation($"Mesaj kaydedildi - SiteKey: {siteKey}, Message: {message}");
            await Task.CompletedTask;
        }

        private string GenerateBotReply(string userMessage)
        {
            // Basit bot mantığı (burada AI servisi entegre edilebilir)
            var lowerMessage = userMessage.ToLower();

            if (lowerMessage.Contains("merhaba") || lowerMessage.Contains("selam"))
                return "Merhaba! Size nasıl yardımcı olabilirim?";

            if (lowerMessage.Contains("fiyat") || lowerMessage.Contains("ücret"))
                return "Fiyatlarımız hakkında detaylı bilgi için satış ekibimizle görüşebilirsiniz.";

            if (lowerMessage.Contains("teşekkür"))
                return "Rica ederim! Başka sorunuz varsa her zaman buradayım.";

            return "Mesajınız alındı. Müşteri temsilcilerimiz en kısa sürede size dönüş yapacaktır.";
        }
    }
}
