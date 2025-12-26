using System.ComponentModel.DataAnnotations;

namespace Sayhi.Model.Reports
{
    public class AgentChat : IEntity<int>
    {
        [Required]
        public int Id { get; set; }

        [Required]
        public DateOnly Date { get; set; }
        public int AgentId { get; set; }
        public string AgentName { get; set; } = "";
        public int Count { get; set; }
    }
}
