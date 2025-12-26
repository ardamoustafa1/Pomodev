using Sayhi.Model;

namespace Sayhi.ApiService.Models.DTOs
{
    public class ChatDto : IDto<Guid>
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = "";
        public List<ChatParticipantDto> Participants { get; set; } = [];
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
        public string LastMessage { get; set; } = "";
        public int UnreadCount { get; set; }

        //public bool IsOnline { get; set; }
        //public string[] Typings { get; set; }

        public SourceType Source { get; set; }
        public Dictionary<string, AlertType> Tags { get; set; } = new();

        public IEntity ConvertTo()
        {
            return new Chat()
            {
                Id = Id,
                Name = Name,
                CreatedAt = CreatedAt
            };
        }

        /*
        Array
            .from({ length: Random(3) }, () => tags[Random(tags.length)])
            .forEach(i =>
            {
                _tags.set(i.value, i.type);
            });

        */

        public static ChatDto Create(Chat c, Guid currentUserId)
        {
            return new ChatDto()
            {
                Id = c.Id,
                Name = c.Name,
                Participants = c
                    .Participants
                    .OrderBy(p => p.PersonId == currentUserId)
                    .Select(p => new ChatParticipantDto()
                    {
                        Id = p.Person.Id,
                        Name = p.Person.Name,
                        Email = p.Person.Email,
                        Avatar = p.Person.AvatarUrl ?? ""
                    })
                    .ToList(),
                CreatedAt = c.CreatedAt,
                LastMessage = c.Messages.LastOrDefault()?.Text ?? "",
                UnreadCount = c.Messages.Where(m => m.Status != MessageStatusType.Read).Count(),
                //IsOnline = Random.Shared.Next(2) == 0
                //IsOnline = false
                Source = c.Source,
                Tags = c.Tags
            };
        }
    }
}