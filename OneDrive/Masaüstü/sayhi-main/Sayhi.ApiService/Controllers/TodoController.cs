using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;

namespace Sayhi.ApiService.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TodoController : ControllerBase
    {
        private static readonly ConcurrentDictionary<long, Todo> data = new();

        [HttpGet]
        public IEnumerable<Todo> GetAll()
        {
            return data.Values.OrderBy(t => t.Position);
        }

        [HttpGet("{id}")]
        public Todo? GetById([FromRoute] int id)
        {
            return data.TryGetValue(id, out var result) ? result : null;
        }

        [HttpPut]
        public Todo Update(int id, Todo todo)
        {
            return data.AddOrUpdate(id, todo, (k, v) => todo);
        }

        [HttpPost]
        public Todo Create(Todo todo)
        {
            if (data.IsEmpty)
            {
                todo.Id = 1;
                todo.Position = 1;
            }
            else
            {
                todo.Id = data.Values.Max(t => t.Id) + 1;
                todo.Position = data.Values.Max(t => t.Position) + 1;
            }

            //return data.AddOrUpdate(todo.Id, todo, (k, v) => todo);
            return data.TryAdd(todo.Id, todo) ? todo : throw new Exception("Failed to add todo.");
        }

        [HttpDelete("{id}")]
        public bool Delete([FromRoute] int id)
        {
            return data.TryRemove(id, out var todo);
        }

        [HttpPost("move-up/{id}")]
        public bool MoveTaskUp([FromRoute] int id)
        {
            if (!data.TryGetValue(id, out var todo))
                return false;

            Todo? prevTodo = data
                .Values
                .Where(t => t.Position < todo.Position)
                .OrderByDescending(t => t.Position)
                .FirstOrDefault();

            if (prevTodo == null)
                return false;

            (todo.Position, prevTodo.Position) = (prevTodo.Position, todo.Position);

            return true;
        }

        [HttpPost("move-down/{id}")]
        public bool MoveTaskDown([FromRoute] int id)
        {
            if (!data.TryGetValue(id, out var todo))
                return false;

            Todo? nextTodo = data
                .Values
                .Where(t => t.Position > todo.Position)
                .OrderByDescending(t => t.Position)
                .FirstOrDefault();

            if (nextTodo == null)
                return false;

            (todo.Position, nextTodo.Position) = (nextTodo.Position, todo.Position);

            return true;
        }
    }

    //public record Todo(int Id, string Title, bool IsComplete, int Position);

    public class Todo
    {
        public int Id { get; set; }
        [Required]
        public string Title { get; set; } = "";
        public bool IsComplete { get; set; }
        [Required]
        public int Position { get; set; }
    }
}
