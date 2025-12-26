using System.ComponentModel.DataAnnotations;

namespace Sayhi.Model.Reports
{
    public class WordFrequency : IEntity<int>
    {
        [Required]
        public int Id { get; set; }
        [Required]
        public DateOnly Date { get; set; }
        public string Keyword { get; set; } = "";

        public int UsageCount { get; set; }
    }
}
