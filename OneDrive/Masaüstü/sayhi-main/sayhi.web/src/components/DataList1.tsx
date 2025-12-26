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

interface HasId
{
    id: string | number;
    [key: string]: any;
}

type ColumnType =
    | "text"
    | "email"
    | "select"
    | "group"
    | "menu";

interface Column<T extends HasId>
{
    header: string;
    required?: boolean;
    field?: keyof T | { key: keyof T; value: keyof T; };
    className?: string;
    onRender?: (row: T) => React.ReactNode;
    type?: ColumnType;
    options?: { value: string; label: string; }[]
}

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

export default function DataList<T extends HasId>({
    title,
    subtitle,
    searchPlaceholder,
    dialogTitleAdd,
    dialogTitleUpdate,
    filters,
    selectedFilters,
    hasActiveFilters,
    clearFilters,
    getEmptyData,
    columns,
    rows,
    //setIsDialogOpen
    handleSubmit,
    handleDelete
}: {
    title: string;
    subtitle?: string;
    searchPlaceholder?: string;
    dialogTitleAdd?: string;
    dialogTitleUpdate?: string;
    filters?: React.ReactNode;
    selectedFilters?: React.ReactNode;
    hasActiveFilters: boolean;
    clearFilters: () => void;
    getEmptyData: () => T;
    columns: Column<T>[];
    rows: T[];
    //setIsDialogOpen: (isOpen: boolean) => void;
    handleSubmit: (formData: T) => void;
    handleDelete: (id: string) => void;
})
{
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [formData, setFormData] = useState<T>(getEmptyData());
    const [selectedId, setSelectedId] = useState<string | number>("");

    const openCreateDialog = () =>
    {
        setIsNew(true);
        setFormData(getEmptyData());
        setIsDialogOpen(true);
    };

    const openEditDialog = (datum: T) =>
    {
        setIsNew(false);
        setFormData(datum);
        setIsDialogOpen(true);
    };

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
                    onClick={() => handleDelete(row.id.toString())}>
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
        </DropdownMenu>);
    };

    function gridCells(column: Column<T>, row: T)
    {
        //onRender: (row) => <ItemMenu agent={row} />
        if (column.type === "menu")
            return <ItemMenu row={row} />;

        return column.onRender ? column.onRender(row) : column.field && getFieldValue(row, column.field);
    }

    function dialogField(column: Column<T>)
    {
        const field: string = String(column.field);

        let component: React.ReactNode;
        switch (column.type)
        {
            case "select":
                component = <Select
                    value={formData[field].toString()}
                    onValueChange={(value) => setFormData({ ...formData, [field]: parseInt(value) })}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {column.options?.map(({ value, label }) => (
                            <SelectItem key={value} value={value}>
                                {label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>;
                break;
            case "group":
                component = <>
                    <Input id={field}
                        value={formData[field]}
                        onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                        placeholder="" />;

                        <div className="grid gap-2">
                            <Label htmlFor="groupId">Grup ID</Label>
                            <Input
                                id="groupId"
                                value={formData.groupId}
                                onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                                placeholder="G1" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="groupName">Grup Adı</Label>
                            <Input
                                id="groupName"
                                value={formData.groupName}
                                onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                                placeholder="Satış Ekibi" />
                        </div>
                    </>
                break;
            default:
                component = <Input id={field}
                    value={formData[field]}
                    onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                    type={column.type ?? "text"}
                    placeholder="" />;
        }

        return (
            <div key={field} className="grid gap-2">
                <Label htmlFor={field}>{column.header} {column.required ? "*" : ""}</Label>
                {component}
            </div>);
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8 text-left">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                <p className="text-gray-600">{subtitle}</p>
            </div>
            <div className="rounded-lg shadow-sm border border-gray-200 mb-6 p-4">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 w-full sm:max-w-md">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <Input
                            type="text"
                            placeholder={searchPlaceholder || "Ara..."}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10" />
                        {searchTerm && (
                            <Button
                                onClick={() => setSearchTerm("")}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <XIcon className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {filters}

                        {hasActiveFilters && (
                            <Button variant="ghost" onClick={clearFilters} className="gap-2">
                                <XIcon className="w-4 h-4" />
                                Temizle
                            </Button>
                        )}
                    </div>

                    <Button onClick={openCreateDialog} className="w-full sm:w-auto">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Yeni
                    </Button>
                </div>

                {hasActiveFilters && (
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                        {selectedFilters}
                    </div>
                )}
            </div>

            <Table className="rounded-lg shadow-sm border border-gray-200">
                {/*<TableCaption>A list of your recent invoices.</TableCaption>*/}
                <TableHeader className="bg-gray-50 border-b border-gray-200">
                    <TableRow>
                        {columns.map((col, index) => (
                            <TableHead key={index} className={`text-xs font-medium text-gray-500 uppercase tracking-wider ${col.className || ""}`}>
                                {col.header}
                            </TableHead>))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {rows.length > 0
                        ? (
                            rows.map((row) => (
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
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>
                            {isNew ? (dialogTitleAdd || "Ekle") : (dialogTitleUpdate || "Düzenle")}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {columns
                            .filter(col => col.field)
                            .map((col) => dialogField(col))}
                    </div>
                    <DialogFooter>
                        <Button onClick={() => handleSubmit(formData)}>{isNew ? "Ekle" : "Güncelle"}</Button>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>İptal</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}