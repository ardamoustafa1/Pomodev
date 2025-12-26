namespace Sayhi.Model
{
    public class Chat : BaseEntity
    {
        public string Name { get; set; } = "";
        //public int Person1Id { get; set; }
        //public Person Person1 { get; set; } = null!;
        //public int Person2Id { get; set; }
        //public Person Person2 { get; set; } = null!;
        public List<ChatMessage> Messages { get; set; } = [];
        //public ICollection<Person> Participants { get; set; } = [];
        public ICollection<ChatParticipant> Participants { get; set; } = [];

        public SourceType Source { get; set; }
        public Dictionary<string, AlertType> Tags { get; set; } = new();
        /*
        --id: "1",
        --name: "Ahmet Yılmaz",
        email: "jitewaboh@lagify.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmet",
        lastMessage: "Projeyi ne zaman teslim edebiliriz?",
        --timestamp: "10:30",
        unreadCount: 3,
        isOnline: true
        */
    }
}
