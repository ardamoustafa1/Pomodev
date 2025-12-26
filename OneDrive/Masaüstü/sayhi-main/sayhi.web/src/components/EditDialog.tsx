import { useState, useCallback } from "react"
import { useForm, Controller, type DefaultValues } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { formatDate } from "../lib/dateTimeUtils"
import { cn } from "../lib/utils"
import { type HasId } from "../lib/Models"
import { type Column } from "./DataModels"

function FormField<T extends HasId>({ column, control }:
    {
        column: Column<T>;
        control: any;
    })
{
    return (
        <div className="grid gap-2" key={String(column.id ?? "")}>
            <Label htmlFor={String(column.id ?? "")}>
                {column.label} {column.required && "*"}
            </Label>

            <Controller
                name={column.id as any}
                control={control}
                render={({ field }) =>
                {
                    switch (column.type)
                    {
                        case "select":
                            //console.log(column.onChange ? column.onChange("1") : "B");
                            //console.log(column.onChange !== null && column.onChange !== undefined ? column.onChange("2") : "B");
                            //console.log(column.onChange !== undefined ? column.onChange("3") : "B");
                            // onValueChange={(value) => field.onChange(column.onChange ? column.onChange(value) : value)}>
                            return (
                                <Select value={field.value}
                                    onValueChange={field.onChange}>
                                    <SelectTrigger id={String(column.id ?? "")}>
                                        <SelectValue placeholder={column.placeholder ?? column.label} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {column.options?.map((opt) => (
                                            <SelectItem key={opt.value} value={opt.value.toString()}>
                                                {opt.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            );

                        case "date":
                            return (
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline"
                                            className={cn(
                                                "justify-start text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}>
                                            <CalendarIcon className="mr-2 h-4 w-4" />
                                            {field.value
                                                ? formatDate(field.value)
                                                : "Tarih seçin"}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            autoFocus />
                                    </PopoverContent>
                                </Popover>
                            );

                        case "checkbox":
                            return (
                                <div className="flex items-center gap-3">
                                    <Checkbox id={String(column.id ?? "")} checked={!!field.value} onCheckedChange={field.onChange} />
                                    <Label htmlFor={String(column.id ?? "")}>{column.placeholder ?? column.label}</Label>
                                </div>
                            );

                        default:
                            return (
                                <Input id={String(column.id ?? "")}
                                    {...field}
                                    type={column.type ?? "text"}
                                    placeholder={column.placeholder ?? column.label}
                                    value={field.value == null ? "" : String(field.value)}
                                    onChange={(e) => field.onChange(e.target.value)} />
                            );
                    }
                }}
            />
        </div>
    );
}

export default function useEditDialog<T extends HasId>(
    titleNew: string,
    titleEdit: string,
    columns: Column<T>[],
    getNewData: () => T,
    onSubmit: (data: Partial<T>, isEdit: boolean) => Promise<void> | void)
{
    /*
    const formSchema = z.object({
        name: z.string().min(1, "İsim gerekli"),
        email: z.string().email("Geçerli e-posta girin").optional(),
            title: z
            .string()
            .min(5, "Bug title must be at least 5 characters.")
            .max(32, "Bug title must be at most 32 characters."),
        description: z
            .string()
            .min(20, "Description must be at least 20 characters.")
            .max(100, "Description must be at most 100 characters.")
    });
    */

    const [visible, setVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const { control, handleSubmit, reset } = useForm<Partial<T>>({
        //resolver: zodResolver(formSchema),
        defaultValues: {} as DefaultValues<Partial<T>>
    });

    const handleDialogSubmit = handleSubmit(async (data) =>
    {
        await onSubmit(data, !!editingItem);
        setVisible(false);
    });

    const EditDialog = useCallback(() => (
        <Dialog open={visible} onOpenChange={setVisible}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {editingItem ? titleEdit : titleNew}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleDialogSubmit} className="grid gap-4 py-4">
                    {columns.map((column) => (
                        <FormField key={String(column.id ?? "")} column={column} control={control} />
                    ))}

                    <DialogFooter>
                        <Button type="submit">
                            {editingItem ? "Güncelle" : "Ekle"}
                        </Button>
                        <Button variant="outline" type="button" onClick={() => setVisible(false)}>
                            İptal
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    ), [visible, editingItem, columns, handleDialogSubmit, control]);

    return {
        openCreateDialog: () =>
        {
            setEditingItem(null);
            reset(getNewData());
            setVisible(true);
        },
        openEditDialog: (item: T) =>
        {
            setEditingItem(item);
            reset(item);
            setVisible(true);
        },
        EditDialog
    };
}