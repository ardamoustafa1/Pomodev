import { Trash2Icon, ArrowBigDownIcon, ArrowBigUpIcon } from "lucide-react"

function TodoItem({ task, deleteTaskCallback, moveTaskUpCallback, moveTaskDownCallback }: {
    task: string;
    deleteTaskCallback: () => void;
    moveTaskUpCallback: () => void;
    moveTaskDownCallback: () => void;
})
{
    return (
        <li aria-label="task">
            <span className="text">{task}</span>
            <button
                type="button"
                aria-label="Move task up"
                className="up-button"
                onClick={() => moveTaskUpCallback()}>
                <ArrowBigUpIcon size="18" />
            </button>
            <button
                type="button"
                aria-label="Move task down"
                className="down-button"
                onClick={() => moveTaskDownCallback()}>
                <ArrowBigDownIcon size="18" />
            </button>
            <button
                type="button"
                aria-label="Delete task"
                className="delete-button pl-4"
                onClick={() => deleteTaskCallback()}>
                <Trash2Icon size="18" />
            </button>
        </li>
    );
}

export default TodoItem;