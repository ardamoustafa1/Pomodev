using Concordia;
using Microsoft.AspNetCore.SignalR;
using Sayhi.ApiService.Clients;
using Sayhi.ApiService.Features.Chat.Events;
using Sayhi.ApiService.Repositories;
using Sayhi.ApiService.Repositories.Cached;
using Sayhi.Model;

namespace Sayhi.ApiService.Hubs
{
    public partial class ChatService(
        PersonCachedRepository personRepository,
        ChatCachedRepository chatRepository,
        IChatMessageRepository chatMessageRepository,
        AIGatewayApiClient aiApiClient,
        IHubContext<ChatHub, IChatHubClient> hubContext,
        IMediator mediator,
        ILogger<ChatService> logger) : IChatService
    {
        private const int MaxMessageLength = 1000;
        public static readonly HubUser SystemHubUser = new("system", "system", HubUserType.System, Guid.Parse("00000000-0000-0000-0000-000000000001"), "", "");
        public static readonly HubUser AIHubUser = new("ai", "ai", HubUserType.AI, Guid.Parse("00000000-0000-0000-0000-000000000041"), "", "");
        private static readonly Connections agentConnections = new();
        private static readonly Connections customerConnections = new();

        public async Task UserConnected(HubCaller caller)
        {
            if (caller.Type == HubUserType.Agent)
            {
                HubUser user = await AgentConnected(caller);

                //await mediator.Send(new AgentConnectedCommand() { User = user, Person = person });
                await mediator.Publish(new AgentConnectedEvent() { User = user });

            }
            else if (caller.Type == HubUserType.Customer)
            {
                HubUser user = await CustomerConnected(caller);

                //await mediator.Send(new CustomerConnectedCommand() { User = user, Person = person });
                await mediator.Publish(new CustomerConnectedEvent() { User = user });
            }
        }

        public async Task UserDisconnected(HubCaller caller)
        {
            Connections connections = GetConnections(caller);

            HubUser? user = connections.Remove(caller.ConnectionId);

            await NotifyDisconnected(user);

            if (user == null)
                return;

            if (caller.Type == HubUserType.Agent)
            {
                //await mediator.Send(new AgentDisconnectedCommand() { User = user/*, Person = person*/ });
                await mediator.Publish(new AgentDisconnectedEvent() { User = user });
            }
            else if (caller.Type == HubUserType.Customer)
            {
                //await mediator.Send(new CustomerDisconnectedCommand() { User = user/*, Person = person*/ });
                await mediator.Publish(new CustomerDisconnectedEvent() { User = user });
            }
        }

        public async Task SendMessage(HubCaller caller, Guid chatId, string text)
        {
            if (string.IsNullOrWhiteSpace(text))
                throw new ArgumentException("Message text is required");

            if (text.Length > MaxMessageLength)
                throw new ArgumentException("Message text is too long");

            HubUser user = GetHubUser(caller);

            string[] recipients = await GetRecipientConnectionIds(chatId);

            //logger.LogInformation($"ChatService: SendMessage: chat.Id {chatId}, User {user.Id}, {user.Name}, {user.ConnectionId}");
            //logger.LogInformation($"ChatService: SendMessage: recipients {string.Join(", ", recipients)}");

            if (recipients.Length == 0)
                throw new InvalidOperationException("Recipient not found");

            ChatMessage chatMessage = await SendMessageInner(chatId, user.Id, text);

            // Mesaj geldi / yollanıyor
            if (user.Type == HubUserType.Customer)
            {
                //if (user.Id != AIHubUser.Id && // Yollayan AI değil
                if (recipients.Contains(AIHubUser.ConnectionId)) // AI ile konuşuyor
                {
                    string aiReply = await aiApiClient.Ask(chatId, text);

                    await SendMessageInner(chatId, AIHubUser.Id, aiReply);
                }
                else // Agent ile konuşuyor
                {
                    string[] aiReplies = await aiApiClient.GetSuggestions(chatId);

                    /*
                    foreach (string aiReply in aiReplies)
                    {
                        MessageDto aiChatMessageDto = new(chatId, AIHubUser.Id, aiReply, DateTimeOffset.UtcNow);
                        await NotifyReceiveSuggestion(aiChatMessageDto);
                    }*/
                    //MessageDto aiChatMessageDto = new(chatId, AIHubUser.Id, aiReply, DateTimeOffset.UtcNow);
                    await NotifyReceiveSuggestion(chatId, chatMessage.Id, aiReplies);
                }
            }
        }

        private async Task<ChatMessage> SendMessageInner(Guid chatId, Guid senderId, string text)
        {
            ChatMessage chatMessage = ChatMessage.Create(chatId, senderId, text);

            await chatMessageRepository.Add(chatMessage);

            MessageDto chatMessageDto = MessageDto.Create(chatMessage);

            await NotifyReceiveMessage(chatMessageDto);

            return chatMessage;
        }

        public async Task SendTyping(HubCaller caller, Guid chatId, bool isTyping)
        {
            HubUser user = GetHubUser(caller);

            string[] recipients = await GetRecipientConnectionIds(chatId);

            await NotifyTyping(chatId, user.Id, isTyping, recipients);
        }

        public async Task Ring(HubCaller caller, Guid chatId, Guid calleeId)
        {
            HubUser user = GetHubUser(caller);

            HubUser callee = GetCallee(calleeId);

            await NotifyRinging(chatId, callee, user);
        }

        public async Task Hangup(HubCaller caller, Guid chatId, Guid calleeId)
        {
            HubUser user = GetHubUser(caller);

            HubUser callee = GetCallee(calleeId);

            await NotifyHangup(chatId, callee, user);
        }

        public async Task Join(HubCaller caller, Guid chatId)
        {
            HubUser user = GetHubUser(caller);

            logger.LogInformation($"ChatService: NotifyJoin: (A) chat.Id {chatId}, User {user.Id}, {user.Name}, {user.ConnectionId}");
            await NotifyJoin(chatId, user);
        }

        public async Task Leave(HubCaller caller, Guid chatId)
        {
            HubUser user = GetHubUser(caller);

            await NotifyLeft(chatId, user);
        }

        public async Task AddAIToChat(HubCaller caller, Guid chatId)
        {
            HubUser user = GetHubUser(caller);

            Chat chat = await GetChat(chatId);

            await AddAI(chat);

            //await NotifyJoin(chat.Id, AIHubUser);

            //Logg("AddAIToChat", chat);
        }

        public async Task AddAgentToChat(HubCaller caller, Guid chatId)
        {
            HubUser user = GetHubUser(caller);

            Chat chat = await GetChat(chatId);

            await AddAgent(chat, user);

            //Logg("AddAgentToChat", chat);
        }

        public async Task RemoveAIFromChat(HubCaller caller, Guid chatId)
        {
            HubUser user = GetHubUser(caller);

            Chat chat = await GetChat(chatId);

            await RemoveAI(chat);

            //Logg("RemoveAIFromChat", chat);
        }

        public async Task RemoveAgentFromChat(HubCaller caller, Guid chatId)
        {
            HubUser user = GetHubUser(caller);

            Chat chat = await GetChat(chatId);

            await RemoveAgent(chat);

            //Logg("RemoveAgentFromChat", chat);
        }

        /*
        private void Logg(string method, Chat chat)
        {
            var participants = chat
                .Participants
                .Select(p =>
                {
                    HubUser? agent = agentConnections.Get(p.PersonId);
                    HubUser? customer = customerConnections.Get(p.PersonId);
                    string type =
                        agent != null ? "agent"
                        : customer != null ? "customer"
                        : p.PersonId == AIHubUser.Id ? "ai"
                        : "none";

                    string name = agent?.Name ?? customer?.Name ?? AIHubUser.Name;

                    return $"{p.PersonId}:{p.Person?.Name},{name},{type}";
                });

            logger.LogInformation($"ChatService: {method}: chat.Id {chat.Id}, chat.CreatedAt {chat.CreatedAt}, chat.Participants {chat.Participants.Count}: {string.Join(", ", participants)}");
        }
        */

        private async Task<HubUser> AgentConnected(HubCaller caller)
        {
            Person? person = await personRepository.Find(p => p.Email == caller.Name);

            HubUser user = new HubUser(caller, person?.Id ?? Guid.Empty, person?.Email ?? "", person?.AvatarUrl ?? "");

            agentConnections.AddOrUpdate(user);

            //await NotifyAgentConnected(caller.ConnectionId, person);
            await NotifyAgentConnected(user);

            return user;
        }

        private async Task<HubUser> CustomerConnected(HubCaller caller)
        {
            Person person = await personRepository.GetOrCreate(caller.Name);

            HubUser user = new HubUser(caller, person.Id, person.Email ?? "", person.AvatarUrl ?? "");

            customerConnections.AddOrUpdate(user);

            await NotifyUserConnected(user);

            Chat? chat = await chatRepository.GetLastChatByUser(person.Id);

            if (chat == null)
            {
                chat = await chatRepository.Add(new Chat());

                await chatRepository.AddParticipants(chat.Id, [person.Id]);
            }

            logger.LogInformation($"ChatService: NotifyJoin: (B) chat.Id {chat.Id}, User {user.Id}, {user.Name}, {user.ConnectionId}");

            await NotifyJoin(chat.Id, user);

            if (chat.Participants.Count == 1)
            {
                await SendMessageInner(chat.Id, SystemHubUser.Id, "Merhaba! Canlı destek ekibimize bağlandınız. Size nasıl yardımcı olabiliriz?");

                await AddAgent(chat, user);
                //await AddAI(chat);
            }

            return user;
        }

        private async Task<HubUser?> AddAgent(Chat chat, HubUser? caller = null)
        {
            HubUser? agent =
                agentConnections.Find(i => i.Name == "ozgur.civi@outlook.com") ??
                agentConnections.GetAll().LastOrDefault();

            if (agent == null)
                return null;
            //  throw new InvalidOperationException("Agent not found");

            logger.LogInformation($"Add Agent chat {chat.Id}, agent {agent.Id}:{agent.Name}");

            //logger.LogInformation($"agents: \r\n{string.Join("\r\n", agentConnections.GetAll().Select(i => $"{i.Id}, {i.Name}"))}.");
            //logger.LogInformation($"customer: \r\n{string.Join("\r\n", customerConnections.GetAll().Select(i => $"{i.Id}, {i.Name}"))}.");

            await chatRepository.AddParticipants(chat.Id, [agent.Id]);

            await NotifyJoin(chat.Id, agent);

            await NotifyRinging(chat.Id, agent, caller);

            return agent;
        }

        private async Task<HubUser> AddAI(Chat chat)
        {
            logger.LogInformation($"ChatService: AddAI: chat.Id {chat.Id}, chat.CreatedAt {chat.CreatedAt}, chat.Participants {chat.Participants.Count}: {string.Join(", ", chat.Participants.Select(i => $"{i.PersonId}:{i.Person?.Name}"))}");

            await chatRepository.AddParticipants(chat.Id, [AIHubUser.Id]);

            await NotifyJoin(chat.Id, AIHubUser);

            return AIHubUser;
        }

        private async Task<HubUser> RemoveAI(Chat chat)
        {
            await chatRepository.RemoveParticipants(chat.Id, [AIHubUser.Id]);

            await NotifyLeft(chat.Id, AIHubUser);

            return AIHubUser;
        }

        private async Task<HubUser> RemoveAgent(Chat chat, HubUser? caller = null)
        {
            HubUser? agent =
                agentConnections.Find(i => i.Name == "ozgur.civi@outlook.com") ??
                agentConnections.GetAll().LastOrDefault();

            if (agent == null)
                throw new InvalidOperationException("Agent not found");

            await chatRepository.RemoveParticipants(chat.Id, [agent.Id]);

            await NotifyLeft(chat.Id, agent);

            await NotifyHangup(chat.Id, agent, caller);

            return agent;
        }

        private async Task<string[]> GetRecipientConnectionIds(
            Guid chatId)
        {
            //if (toId != null && toId != Guid.Empty)
            //{
            //    string? recipientConnectionId = connections.GetConnectionId(toId.Value);
            //
            //    return recipientConnectionId == null ? [] : [recipientConnectionId];
            //}

            Chat? chat = await chatRepository.GetById(chatId);

            if (chat == null)
                return [];

            return chat
                .Participants
                //.Select(p => connections.GetConnectionId(p.PersonId))
                .Select(p =>
                    customerConnections.GetConnectionId(p.PersonId) ??
                    agentConnections.GetConnectionId(p.PersonId) ??
                    (p.PersonId == AIHubUser.Id ? AIHubUser.ConnectionId : null))
                .Where(c => c != null)
                //.Select(c => c ?? "")
                .OfType<string>()
                .ToArray();
        }

        private HubUser GetHubUser(HubCaller caller)
        {
            Connections connections = GetConnections(caller);
            HubUser? user = connections.GetUser(caller.ConnectionId);

            if (user == null)
                throw new InvalidOperationException("User not found");

            return user;
        }

        private HubUser GetCallee(Guid calleeId)
        {
            HubUser? callee =
                agentConnections.Get(calleeId) ??
                customerConnections.Get(calleeId);

            if (callee == null)
                throw new InvalidOperationException("Callee not found");

            return callee;
        }

        private async Task<Chat> GetChat(Guid chatId)
        {
            Chat? chat = await chatRepository.GetById(chatId);

            if (chat == null)
                throw new InvalidOperationException("Chat not found");

            return chat;
        }

        private Connections GetConnections(HubCaller caller)
        {
            return caller.Type == HubUserType.Customer ? customerConnections : agentConnections;
        }
    }
}