using Sayhi.Model;

namespace Sayhi.ApiService.Models.DTOs
{
    /*
     public interface IDto<K, TSelf>
         where TSelf : IDto<K, TSelf>
     {
         K Id { get; set; }
         IEntity<K> ConvertTo();

         static abstract TSelf Create(IEntity<K> domain);
     }
     */

    public interface IDto<K>
    {
        K Id { get; set; }
        //IEntity<K> ConvertTo();
        //IEntity ConvertTo();
    }
}