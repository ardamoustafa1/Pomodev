namespace Sayhi.Model
{
    public interface IEntity
    {
    }

    public interface IEntity<K> : IEntity
    {
        K Id { get; set; }
    }
}
