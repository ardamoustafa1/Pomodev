using Microsoft.EntityFrameworkCore.Query;
using Sayhi.Model;

namespace Sayhi.ApiService.Models.Requests
{
    public record PersonRequest(
        //Guid Id,
        string? Name,
        bool? IsActive) : IRequest<Guid, Person>
    {
        //public Expression<Func<SetPropertyCalls<Person>, SetPropertyCalls<Person>>> UpdateFields()
        public Action<UpdateSettersBuilder<Person>> UpdateFields()
        {
            return setters => setters
                //.SetProperty(d => d.Id, Id)
                .SetProperty(d => d.Name, Name);
        }

        public Person UpdateFields(Person current)
        {
            current.Name = Name ?? current.Name;
            //current.IsActive = IsActive ?? current.IsActive;
            return current;
        }
    }
}