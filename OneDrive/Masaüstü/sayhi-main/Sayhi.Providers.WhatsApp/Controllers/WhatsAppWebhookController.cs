using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Sayhi.Providers.WhatsApp.Controllers
{
    [AllowAnonymous]
    [ApiController]
    [Route("webhook")]
    public class WhatsAppWebhookController(WhatsAppCloudApiProvider whatsAppCloudApiProvider)
       : ControllerBase
    {
        [HttpGet]
        public IActionResult Verify(
            //[FromQuery] string hub_mode, [FromQuery] string hub_challenge, [FromQuery] string hub_verify_token)
            [FromQuery(Name = "hub.mode")] string hub_mode,
            [FromQuery(Name = "hub.challenge")] string hub_challenge,
            [FromQuery(Name = "hub.verify_token")] string hub_verify_token)
        {
            Console.WriteLine($"hub_mode: {hub_mode}");
            Console.WriteLine($"hub_challenge: {hub_challenge}");
            Console.WriteLine($"hub_verify_token: {hub_verify_token}");

            if (hub_mode == "subscribe" && hub_verify_token == whatsAppCloudApiProvider.VerifyToken)
            {
                return Ok(hub_challenge);
            }

            return Forbid();
        }

        [HttpPost]
        public async Task<IActionResult> Receive()
        {
            Console.WriteLine("Receive");
            using StreamReader sr = new(Request.Body, Encoding.UTF8);

            string body = await sr.ReadToEndAsync();

            Console.WriteLine($"body {body}");

            if (!Request.Headers.TryGetValue("X-Hub-Signature-256", out var signatureHeader))
                return BadRequest("Missing signature header");

            if (!whatsAppCloudApiProvider.VerifySignature(body, signatureHeader.ToString()))
                //return Unauthorized("Invalid signature");
                return StatusCode(403, "Invalid signature");

            whatsAppCloudApiProvider.Receive(body);

            return Ok();
        }

        [HttpPut]
        public async Task<IActionResult> Test(
            [FromQuery] string recipient,
            [FromQuery] string text)
        {
            var result = await whatsAppCloudApiProvider.SendTextMessageAsync(recipient, text);

            return Ok(result);
        }

        [HttpDelete]
        public async Task<IActionResult> Test2(
            [FromQuery] string recipient)
        {
            var result = await whatsAppCloudApiProvider.SendTemplateMessageAsync(recipient);

            return Ok(result);
        }
    }
}
