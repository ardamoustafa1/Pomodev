using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using Microsoft.Extensions.Configuration;

namespace Sayhi.Providers.WhatsApp
{
    /*
    > ssh -R 80:localhost:5406 localhost.run

    https://9e6ef38eeda8ec.lhr.life/swagger/index.html

    https://9e6ef38eeda8ec.lhr.life/webhook
    CokGizliSecretToken123.,0194d2f3-7f38-41b4-9f51-3c662a7e7a89
    */
    public class WhatsAppCloudApiProvider
    {
        public readonly string VerifyToken;

        private readonly string AppSecret; // App Secret (Meta)
        private readonly string AccessToken; // Cloud API Access Token
        private readonly string PhoneNumberId; // Cloud API Phone Number Id
        //private readonly string WhatsAppBusinessAccountId;

        //Subscribe to fields: messages, message_deliveries, message_reads, messaging_product:whatsapp

        public WhatsAppCloudApiProvider(IConfiguration config)
        {
            AppSecret = config["WhatsApp:AppSecret"] ?? "";
            AccessToken = config["WhatsApp:AccessToken"] ?? "";
            VerifyToken = config["WhatsApp:VerifyToken"] ?? "";
            PhoneNumberId = config["WhatsApp:PhoneNumberId"] ?? "";
            //WhatsAppBusinessAccountId = config["WhatsApp:WhatsAppBusinessAccountId"] ?? "";
        }

        /*
        {
            "messaging_product": "whatsapp",
            "contacts": [
                {
                    "input": "3725xxxxxxx",
                    "wa_id": "3725xxxxxxx"
                }
            ],
            "messages": [
                { "id": "wamid.HBgLMzcyNTQ1NzQ0NDUVAgARGBJENjNFRDhGRTUyQjU5QzM3NTQA" }
            ]
        }

        {
              "messaging_product": "whatsapp",
              "contacts": [
                {
                  "input": "+37254574445",
                  "wa_id": "37254574445"
                }
              ],
              "messages": [
                {
                  "id": "wamid.HBgLMzcyNTQ1NzQ0NDUVAgARGBIxQTU5MENDOTU4RjE3MjM2NjAA"
                }
              ]
            }

        {
              "error": {
                "message": "(#132001) Template name does not exist in the translation",
                "type": "OAuthException",
                "code": 132001,
                "error_data": {
                  "messaging_product": "whatsapp",
                  "details": "template name (Nasilsin ya) does not exist in en_US"
                },
                "fbtrace_id": "AgGJpoSbdUa4jORZ-6fL_eK"
              }
            }
        */
        public async Task<JsonNode?> SendMessageAsync<T>(string recipient, T message)
        {
            // recipient : "whatsapp:+37254574445"
            // recipient : "37254574445"
            using HttpClient httpClient = new();

            httpClient.DefaultRequestHeaders.Authorization =
                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", AccessToken);

            StringContent content = new(JsonSerializer.Serialize(message), Encoding.UTF8, "application/json");

            /*
curl -i -X POST `
https://graph.facebook.com/v22.0/821352907733650/messages `
-H 'Authorization: Bearer EAALdSCxgoZCMBPwgbuOa3msfbLm96UUvDgO4AuR7lLZCTKkWuR9JNv3Vh4yRO1AUZBc7oPW9yP3mZCYLZA3TVfAhW0Ms307eP7ZCfgDETHJVdy82IN0fumRviZAyLndlltGuEK60qtLZBeOLCa6UZALbycNGsaMGzVcfZBLZAVGzy6Q3osHe540jM53ZCB2G4cOFtigsmaZCbfsZANPCBBXuoRVOB3OpOVZC6widm4pSZBbVAiHAv0DIzb3IepGDknZCSfMmApZCLRpCSB9iP1oOOsadVQ7rQCXJgZD' `
-H 'Content-Type: application/json' `
-d '{ \"messaging_product\": \"whatsapp\", \"to\": \"37254574445\", \"type\": \"template\", \"template\": { \"name\": \"hello_world\", \"language\": { \"code\": \"en_US\" } } }'
 */

            var response = await httpClient.PostAsync(
                $"https://graph.facebook.com/v22.0/{PhoneNumberId}/messages",
                content);

            string responseBody = await response.Content.ReadAsStringAsync();

            Console.WriteLine($"Response: {response.StatusCode} - {responseBody}");

            return JsonNode.Parse(responseBody);
        }

        public async Task<JsonNode?> SendTextMessageAsync(string recipient, string text)
        {
            return await SendMessageAsync(recipient,
                new
                {
                    messaging_product = "whatsapp",
                    to = recipient,
                    type = "text",
                    text = new { body = text }
                });
        }

        public async Task<JsonNode?> SendTemplateMessageAsync(string recipient, string template = "hello_world")
        {
            return await SendMessageAsync(recipient,
                new
                {
                    messaging_product = "whatsapp",
                    to = recipient,
                    type = "template",
                    template = new
                    {
                        name = template,
                        language = new
                        {
                            code = "en_US"
                        }/*,
                        components = new[] {
                            new {
                                type = "body",
                                parameters = new[] {
                                    new {
                                        type= "text",
                                        text= "John"
                                    }
                                }
                            }
                        }*/
                    }
                });
        }

        /*
        {
          "object": "whatsapp_business_account",
          "entry": [
            {
              "id": "1984010839112684",
              "changes": [
                {
                  "value": {
                    "messaging_product": "whatsapp",
                    "metadata": {
                      "display_phone_number": "15556483936",
                      "phone_number_id": "821352907733650"
                    },
                    "contacts": [
                      {
                        "profile": {
                          "name": "\u00D6zg\u00FCr \u00C7ivi"
                        },
                        "wa_id": "37254574445"
                      }
                    ],
                    "messages": [
                      {
                        "from": "37254574445",
                        "id": "wamid.HBgLMzcyNTQ1NzQ0NDUVAgASGBYzRUIwRjg0RTQwRjhDN0Q0MUY5MkZGAA==",
                        "timestamp": "1761911975",
                        "text": {
                          "body": "ne diyosun aslan\u0131m?"
                        },
                        "type": "text"
                      }
                    ]
                  },
                  "field": "messages"
                }
              ]
            }
          ]
        } 
        */
        public void Receive(string body)
        {
            JsonNode? json = JsonNode.Parse(body);

            Console.WriteLine("Received webhook: " + json);

            JsonArray? entries = json?["entry"]?.AsArray();
            if (entries != null)
            {
                foreach (JsonNode? entry in entries!)
                {
                    JsonArray? changes = entry?["changes"]?.AsArray();
                    if (changes == null)
                        continue;
                    foreach (JsonNode? change in changes)
                    {
                        JsonNode? value = change?["value"];
                        JsonArray? messages = value?["messages"]?.AsArray();
                        if (messages == null)
                            continue;

                        foreach (JsonNode? message in messages)
                        {
                            string? from = message?["from"]?.ToString();
                            string? text = message?["text"]?["body"]?.ToString();
                            Console.WriteLine($"Message from {from}: {text}");

                            // Burada: DB'ye kaydet, iş akışı tetikle, cevap gönder vb.
                            // Örnek olarak otomatik cevap göndermek istersen:

                            //if (!string.IsNullOrEmpty(from))
                            //{
                            //    await SendTextMessageAsync(from, "Teşekkürler! Mesajınız alındı. ✅");
                            //}
                        }
                    }
                }
            }
        }

        public bool VerifySignature(string body, string headerSignature)
        {
            // headerSignature formu: "sha256=..." veya sadece "sha256=xxx"
            var expectedPrefix = "sha256=";
            var sig = headerSignature.ToString();
            if (!sig.StartsWith(expectedPrefix)) return false;
            var signature = sig.Substring(expectedPrefix.Length);

            using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(AppSecret));
            var computedHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(body));
            var computedHex = BitConverter.ToString(computedHash).Replace("-", "").ToLower();

            return computedHex == signature;
        }
    }
}
