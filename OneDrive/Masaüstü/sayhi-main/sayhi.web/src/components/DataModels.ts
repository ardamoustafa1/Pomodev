import { type HasId } from "../lib/Models"

export interface Column<T extends HasId>
{
    //id?: keyof T | { key: keyof T; value: keyof T; }; // | string | number;
    id?: keyof T | string | number | null;
    label: string;
    placeholder?: string;
    required?: boolean;
    className?: string;
    onRender?: (row: T) => React.ReactNode;
    type?: "text" | "number" | "email" | "select" | "date" | "checkbox"
    | "group" | "menu";
    options?: { value: string | number; label: string; }[]
}
