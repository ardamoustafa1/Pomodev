import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { PencilIcon, Trash2Icon, XIcon, PlusIcon, SearchIcon, Component } from "lucide-react"
//import { XIcon, PlusIcon, SearchIcon, FilterIcon, ChevronDownIcon } from "lucide-react"
import { useFilter, toFilterOptions, type Filter } from "./Filter"
import Search from "./Search"
import useEditDialog from "./EditDialog"
import { type Column } from "./DataModels"
//import useDialog from "./Dialog"
import { type HasId } from "../lib/Models"


function getFieldValue<T>(row: T, field: keyof T | { key: keyof T; value: keyof T; }): any
{
    if (typeof field === "object" && "key" in field && "value" in field)
    {
        return row[field.value];
    }

    //console.log("row", row);
    //console.log("field", field);

    return String(row[field]);
}

/*
    properties: Property[],
*/

export default function DataList<T extends HasId>({
    title,
    subtitle,
    titleNew,
    titleEdit,
    filters,
    searchPlaceholder,
    //dialogTitleAdd,
    //dialogTitleUpdate,
    //filters,
    //selectedFilters,
    //hasActiveFilters,
    //clearFilters,
    getNewData,
    columns,
    data,
    //handleSubmit,
    //handleDelete
    onNew,
    onEdit,
    onDelete
}: {
    title: string;
    subtitle?: string;
    titleNew: string;
    titleEdit: string;
    filters: Filter[];
    searchPlaceholder?: string;
    //dialogTitleAdd?: string;
    //dialogTitleUpdate?: string;
    //filters?: React.ReactNode;
    //selectedFilters?: React.ReactNode;
    //hasActiveFilters: boolean;
    //clearFilters: () => void;
    getNewData: () => T,
    columns: Column<T>[];
    data: T[];
    //handleSubmit: (formData: T) => void;
    //handleDelete: (id: string) => void;
    onNew: (item: Partial<T>) => Promise<void> | void;
    onEdit: (item: Partial<T>) => Promise<void> | void;
    onDelete: (id: string) => Promise<void> | void;
})
{
    //const [selectedId, setSelectedId] = useState<string>("");
    const [selectedId, setSelectedId] = useState<string | number>("");
    //const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [formData, setFormData] = useState<T>(getNewData());

    const ItemMenu = ({ row }: { row: T }) =>
    {
        return (<DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-full">...</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="start">
                <DropdownMenuItem onClick={() => openEditDialog(row)}>
                    {/*<UserPenIcon />*/}
                    <PencilIcon />
                    Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 focus:bg-red-100 dark:text-red-500 dark:focus:bg-red-900"
                    onClick={() => onDelete(row.id.toString())}>
                    <Trash2Icon />
                    Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>);
    };

    function gridCells(column: Column<T>, row: T)
    {
        //onRender: (row) => <ItemMenu agent={row} />
        if (column.type === "menu")
            return <ItemMenu row={row} />;

        return column.onRender ? column.onRender(row) : column.id && getFieldValue(row, column.id);
    }

    //const confirm = useDialog("Are you sure?", "It will be deleted.", ["Ok", "Cancel"]);
    const { openCreateDialog, openEditDialog, EditDialog } = useEditDialog<T>(
        titleNew,
        titleEdit,
        [
            { id: "name", label: "Name", required: true },
            { id: "email", label: "E-posta", type: "email" },
            {
                id: "role", label: "Rol", type: "select", options: [
                    { value: "admin", label: "Yönetici" },
                    { value: "user", label: "Kullanıcı" }
                ]
            },
            { id: "startDate", label: "Başlangıç Tarihi", type: "date" },
            { id: "isActive", label: "Durum", placeholder: "Aktif mi?", type: "checkbox" },
            { id: "description", label: "Description" }
        ],
        getNewData,
        async (datum, isEdit) =>
        {
            console.log(datum, isEdit);
            if (isEdit)
            {
                onEdit(datum);
            }
            else
            {

                onNew(datum);
            }
        });

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8 text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                <p className="text-gray-600">{subtitle}</p>
            </div>
            <div className="rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <Search placeholder={searchPlaceholder} />
                    <div className="flex gap-2">
                        {filters.map(filter => filter.Select)}

                        {filters.filter(filter => filter.isSelected()).length > 0 && (
                            <Button variant="ghost" onClick={() => filters.forEach(filter => filter.clear())} className="gap-2">
                                <XIcon className="w-4 h-4" />
                                Temizle
                            </Button>
                        )}
                    </div>

                    <Button onClick={() => openCreateDialog()} className="w-full sm:w-auto">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Yeni
                    </Button>
                </div>
                {filters.filter(filter => filter.isSelected()).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                        {filters.map(filter => filter.Display)}
                    </div>
                )}
            </div>

            <Table className="rounded-lg shadow-sm border border-gray-200">
                <TableHeader className="bg-gray-50 border-b border-gray-200">
                    <TableRow>
                        {columns.map((col, index) => (
                            <TableHead key={index} className={`text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className || ""}`}>
                                {col.label}
                            </TableHead>))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.length > 0
                        ? (
                            data.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={selectedId === row.id && "selected"}
                                    onClick={() => setSelectedId(row.id)}
                                    onDoubleClick={() => openEditDialog(row)}
                                    className="cursor-pointer">
                                    {columns.map((col, colIndex) => (
                                        <TableCell key={colIndex} className="text-left whitespace-nowrap">
                                            {gridCells(col, row)}
                                        </TableCell>))}
                                </TableRow>
                            ))
                        )
                        : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-50 text-center text-gray-500">
                                    Kayıt bulunamadı
                                </TableCell>
                            </TableRow>
                        )}
                </TableBody>
            </Table>

            <EditDialog />

        </div>
    );
}