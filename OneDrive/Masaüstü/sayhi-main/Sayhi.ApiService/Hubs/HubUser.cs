namespace Sayhi.ApiService.Hubs
{
    public record HubUser : HubCaller
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string Avatar { get; set; }

        public HubUser(string ConnectionId, string Name, HubUserType Type, Guid Id, string Email, string Avatar)
            : base(ConnectionId, Name, Type)
        {
            this.Id = Id;
            this.Email = Email;
            this.Avatar = Avatar;
        }

        public HubUser(HubCaller hubUser, Guid id, string email, string avatar)
            : base(hubUser.ConnectionId, hubUser.Name, hubUser.Type)
        {
            this.Id = id;
            this.Email = email;
            this.Avatar = avatar;
        }
    }
}