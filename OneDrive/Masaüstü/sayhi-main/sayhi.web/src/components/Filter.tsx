import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import
{
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { XIcon, FilterIcon, ChevronDownIcon } from "lucide-react"

type FilterItem = { value: string | number; label?: string; color?: string; }

type FilterParameter = {
    name: string;
    all: FilterItem[];
    selected: (string | number)[];
    toggle: (value: string | number) => void;
    isSelected: () => Boolean;
    getLabel: (value: string | number) => string;
}

export type Filter = {
    Parameter: FilterParameter;
    Select: React.ReactNode;
    Display: React.ReactNode;
    clear: () => void;
    isSelected: () => Boolean;
}

/*
function toRecord<
    T extends { [K in keyof T]: string | number | symbol },
    K extends keyof T
>(array: T[], selector: K): Record<T[K], T>
{
    return array.reduce((acc, item) => (acc[item[selector]] = item, acc), {} as Record<T[K], T>)
}

export const useFilter1 = (name: string, filter: FilterItem[]): FilterParameter =>
{
    const [selected, setSelected] = useState<(string | number)[]>([]);
    return {
        name: name,
        all: filter,
        selected: selected,
        toggle: (value: string | number) =>
        {
            setSelected(prev => prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value]);
        },
        isSelected: () => selected.length > 0,
        getLabel: (value: string | number) =>
            filter
                .find(i => i.value === value)?.label
            ?? String(value)
    };
};
*/

function FilterSelect({ filter }: { filter: FilterParameter })
{
    //const all = Object.entries(filter.all) as [F, FilterExtra][];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FilterIcon className="w-4 h-4" />
                    {filter.name}
                    {filter.isSelected() && (
                        <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-xs">
                            {filter.selected.length}
                        </Badge>
                    )}
                    <ChevronDownIcon className="w-4 h-4 ml-auto" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{filter.name} Filtresi</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filter
                    .all
                    .map(({ value, label, color }) => (
                        <DropdownMenuCheckboxItem
                            key={String(value)}
                            checked={filter.selected.includes(value)}
                            onCheckedChange={() => filter.toggle(value)}>
                            {label && color
                                ? <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${color}`} />
                                    {label}
                                </div>
                                : String(value)}
                        </DropdownMenuCheckboxItem>
                    ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function FilterDisplay({ filter }: { filter: FilterParameter })
{
    return filter.isSelected() &&
        filter.selected.map((value) => (
            <Badge key={String(value)} variant="secondary" className="gap-1.5 pl-2 pr-1">
                {filter.getLabel(value)}
                <Button
                    onClick={() => filter.toggle(value)}
                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                    <XIcon className="w-3 h-3" />
                </Button>
            </Badge>
        ));
}

export const toFilterOptions = <T extends keyof any>(filter: T[] | Record<T, { label?: string; color?: string; }>): FilterItem[] =>
{
    return filter instanceof Array
        ? (filter as T[]).map(i => ({ value: i, label: undefined, color: undefined }) as FilterItem)
        : (Object.entries(filter) as [T, { label?: string; color?: string }][])
            .map(([value, { label, color }]) => ({ value, label, color }) as FilterItem);
}

export const useFilter = (name: string, filterItems: FilterItem[]): Filter =>
{
    const [selected, setSelected] = useState<(string | number)[]>([]);

    const parameter = {
        name: name,
        all: filterItems,
        selected: selected,
        toggle: (value: string | number) =>
        {
            setSelected(prev => prev.includes(value)
                ? prev.filter(v => v !== value)
                : [...prev, value]);
        },
        isSelected: () => selected.length > 0,
        getLabel: (value: string | number) =>
            filterItems.find(i => i.value === value)?.label
            ?? String(value)
    }

    return ({
        Parameter: parameter,
        Select: <FilterSelect key={name} filter={parameter} />,
        Display: <FilterDisplay key={name} filter={parameter} />,
        clear: () => setSelected([]),
        isSelected: parameter.isSelected
    });
};