import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { PencilIcon, Trash2Icon } from "lucide-react"
import { type HasId } from "../lib/Models"

export default function ItemMenu<T extends HasId>({ item, openEditDialog, onDelete }: {
    item: T;
    openEditDialog: (item: T) => void;
    onDelete: (id: string) => void;
})
{
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">...</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuItem onClick={() => openEditDialog(item)}>
                    {/*<UserPenIcon />*/}
                    <PencilIcon />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:bg-red-100 dark:text-red-500 dark:focus:bg-red-900"
                    onClick={() => onDelete(String(item.id))}>
                    <Trash2Icon />
                    Delete
                </DropdownMenuItem>
                {/*
                <DropdownMenuItem>
                    Edit
                    <UserPenIcon className="ms-auto" />
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:bg-red-100 dark:text-red-500 dark:focus:bg-red-900">
                    Delete
                    <Trash2Icon className="ms-auto" />
                </DropdownMenuItem>
                */}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}