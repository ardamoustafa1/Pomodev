import { useState, useEffect, type ChangeEvent, type FormEvent } from "react"
import { getWithAuth, postWithAuth, putWithAuth, deleteWithAuth } from "../lib/httpClient"
import TodoItem from "./TodoItem"
import "./TodoList.css"

type Todo = {
    id: number;
    title: string;
    isCompleted: boolean;
};

const todoHttpClients = {
    get: async (): Promise<Todo[]> =>
    {
        return await getWithAuth<Todo[]>("/api/Todo") ?? [];
    },
    create: async (todo: Todo): Promise<Todo> =>
    {
        return await postWithAuth<Todo>("/api/Todo", todo);
    },
    update: async (todo: Todo): Promise<Todo> =>
    {
        return await putWithAuth<Todo>("/api/Todo", todo);
    },
    delete: async (id: number): Promise<boolean> =>
    {
        return await deleteWithAuth<boolean>(`/api/Todo/${id}`) ?? false;
    },
    moveUp: async (id: number): Promise<boolean> =>
    {
        return await postWithAuth<boolean>(`/api/Todo/move-up/${id}`);
    },
    moveDown: async (id: number): Promise<boolean> =>
    {
        return await postWithAuth<boolean>(`/api/Todo/move-down/${id}`);
    }
};

function TodoList()
{
    //const [tasks, setTasks] = useState([]);
    const [newTaskText, setNewTaskText] = useState<string>("");
    const [todos, setTodo] = useState<Todo[]>([]);

    const getTodo = async () =>
    {
        const json = await todoHttpClients.get();

        if (json)
        {
            setTodo(json);
        }
    }

    useEffect(() =>
    {
        getTodo();
    }, []);

    function handleInputChange(event: ChangeEvent<HTMLInputElement>)
    {
        setNewTaskText(event.target.value);
    }

    async function addTask(event: FormEvent<HTMLFormElement>)
    {
        event.preventDefault();
        if (newTaskText.trim())
        {
            const result = await todoHttpClients.create({
                id: -1,
                title: newTaskText,
                isCompleted: false
            });

            if (result)
            {
                await getTodo();
            }

            setNewTaskText("");
        }
    }

    async function deleteTask(id: number)
    {
        console.log(`deleting todo ${id}`);
        const result = await todoHttpClients.delete(id);

        if (result)
        {
            await getTodo();
        }
    }

    async function moveTaskUp(index: number)
    {
        console.log(`moving todo ${index} up`);
        const todo = todos[index];
        const result = await todoHttpClients.moveUp(todo.id);

        if (result)
        {
            await getTodo();
        }
    }

    async function moveTaskDown(index: number)
    {
        const todo = todos[index];
        const result = await todoHttpClients.moveDown(todo.id);

        if (result)
        {
            await getTodo();
        }
    }

    return (
        <article className="todo-list" aria-label="task list manager">
            <header>
                <h1>TODO</h1>
                <form className="todo-input" aria-controls="todo-list" onSubmit={addTask}>
                    <input type="text" placeholder="Enter a task" aria-label="Task text" required autoFocus
                        value={newTaskText} onChange={handleInputChange} />
                    <button className="add-button" aria-label="Add task">
                        Add
                    </button>
                </form>
            </header>
            <ol id="todo-list" aria-live="polite" aria-label="task list">
                {todos.map((task, index) =>
                    <TodoItem
                        key={task.id}
                        task={task.title}
                        deleteTaskCallback={() => deleteTask(task.id)}
                        moveTaskUpCallback={() => moveTaskUp(index)}
                        moveTaskDownCallback={() => moveTaskDown(index)}
                    />
                )}
            </ol>
        </article>
    );
}

export default TodoList;