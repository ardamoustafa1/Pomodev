using System.ComponentModel.DataAnnotations;

namespace Sayhi.Model
{
    public abstract class BaseEntityWithCreated : IEntity
    {
        [Required]
        public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    }
}
