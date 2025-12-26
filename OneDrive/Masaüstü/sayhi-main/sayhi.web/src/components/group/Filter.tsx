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
import { AgentStatus } from "../../lib/Models"

type FilterParameters = {
    allGroups: string[];
    //allStatuses: [string, string][];
    allStatuses: Record<AgentStatus, { label: string; color: string }>;
    selectedStatuses: AgentStatus[];
    selectedGroups: string[];
    toggleStatus: (status: AgentStatus) => void;
    toggleGroup: (group: string) => void;
    clearFilters: () => void;
}

//export type Statuses = Record<AgentStatus, { label: string; color: string }>;

export const useFilter = (statuses: Record<AgentStatus, { label: string; color: string }>, groupNames: string[]) =>
{
    const [selectedStatuses, setSelectedStatuses] = useState<AgentStatus[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

    /*
    const statusList = Object.fromEntries(
        statuses.map(i => [i.value, { label: i.label, color: i.color }])
    ) as Record<AgentStatus, { label: string; color: string }>;
    */

    return {
        allGroups: Array.from(new Set(groupNames)) as string[],
        allStatuses: statuses,
        selectedStatuses,
        selectedGroups,
        //hasActiveFilters: selectedStatuses.length > 0 || selectedGroups.length > 0,
        toggleStatus: (status: AgentStatus) =>
        {
            setSelectedStatuses(prev =>
                prev.includes(status)
                    ? prev.filter(s => s !== status)
                    : [...prev, status]
            );
        },
        toggleGroup: (group: string) =>
        {
            setSelectedGroups(prev =>
                prev.includes(group)
                    ? prev.filter(g => g !== group)
                    : [...prev, group]
            );
        },
        clearFilters: () =>
        {
            setSelectedStatuses([]);
            setSelectedGroups([]);
        }
    };
};

function StatusFilter({ filter }: { filter: FilterParameters })
{
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FilterIcon className="w-4 h-4" />
                    Durum
                    {filter.selectedStatuses.length > 0 && (
                        <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-xs">
                            {filter.selectedStatuses.length}
                        </Badge>
                    )}
                    <ChevronDownIcon className="w-4 h-4 ml-auto" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Duruma Göre Filtrele</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {Object.entries(filter.allStatuses).map(([value, { label }]) => (
                    <DropdownMenuCheckboxItem
                        key={value}
                        checked={filter.selectedStatuses.includes(parseInt(value) as AgentStatus)}
                        onCheckedChange={() => filter.toggleStatus(parseInt(value) as AgentStatus)}>
                        <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${filter.allStatuses[parseInt(value) as AgentStatus].color}`} />
                            {label}
                        </div>
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function GroupFilter({ filter }: { filter: FilterParameters })
{
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FilterIcon className="w-4 h-4" />
                    Grup
                    {filter.selectedGroups.length > 0 && (
                        <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-xs">
                            {filter.selectedGroups.length}
                        </Badge>
                    )}
                    <ChevronDownIcon className="w-4 h-4 ml-auto" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Gruba Göre Filtrele</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {filter.allGroups.map((group) => (
                    <DropdownMenuCheckboxItem
                        key={group}
                        checked={filter.selectedGroups.includes(group)}
                        onCheckedChange={() => filter.toggleGroup(group)}>
                        {group}
                    </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export function Filters({ filter }: { filter: FilterParameters })
{
    const hasActiveFilters = filter.selectedStatuses.length > 0 || filter.selectedGroups.length > 0;

    return (
        <div className="flex gap-2">
            <StatusFilter filter={filter} />
            <GroupFilter filter={filter} />

            {hasActiveFilters && (
                <Button variant="ghost" onClick={filter.clearFilters} className="gap-2">
                    <XIcon className="w-4 h-4" />
                    Temizle
                </Button>
            )}
        </div>
    );
}

export function FilterDisplay({ filter }: { filter: FilterParameters })
{
    const hasActiveFilters = filter.selectedStatuses.length > 0 || filter.selectedGroups.length > 0;

    return hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
            {filter.selectedStatuses.map((status) => (
                <Badge key={status} variant="secondary" className="gap-1.5 pl-2 pr-1">
                    <span className={`w-2 h-2 rounded-full ${filter.allStatuses[status].color}`} />
                    {filter.allStatuses[status].label}
                    <Button
                        onClick={() => filter.toggleStatus(status)}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                        <XIcon className="w-3 h-3" />
                    </Button>
                </Badge>
            ))}
            {filter.selectedGroups.map((group) => (
                <Badge key={group} variant="secondary" className="gap-1.5 pl-2 pr-1">
                    {group}
                    <Button
                        onClick={() => filter.toggleGroup(group)}
                        className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                        <XIcon className="w-3 h-3" />
                    </Button>
                </Badge>
            ))}
        </div>
    );
}