using System.ComponentModel.DataAnnotations;

namespace Sayhi.Model
{
    public abstract class BaseEntity : BaseEntityWithCreated, IEntity<Guid>
    {
        [Required]
        public Guid Id { get; set; } = Guid.CreateVersion7();
    }
}
