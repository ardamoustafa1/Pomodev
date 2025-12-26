import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table"
import { PencilIcon, Trash2Icon, XIcon, PlusIcon, SearchIcon, FilterIcon, ChevronDownIcon } from "lucide-react"
import { useAgents } from "./useAgents"
import { AgentStatus, type Agent } from "../../lib/Models"
//import DataList, { type ColumnType } from "../DataList"
import DataList from "../DataList1"

const statusLabels: Record<AgentStatus, string> = {
    [AgentStatus.Available]: "Müsait",
    [AgentStatus.Busy]: "Meşgul",
    [AgentStatus.OnBreak]: "Mola",
    [AgentStatus.Training]: "Eğitim",
    [AgentStatus.Away]: "Pasif"
};

const statusColors: Record<AgentStatus, string> = {
    [AgentStatus.Available]: "bg-green-500",
    [AgentStatus.Busy]: "bg-red-500",
    [AgentStatus.OnBreak]: "bg-yellow-500",
    [AgentStatus.Training]: "bg-blue-500",
    [AgentStatus.Away]: "bg-gray-500"
};

export default function AgentList()
{
    const { agents, setAgents } = useAgents();
    const [searchTerm, setSearchTerm] = useState("");
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
    const [selectedAgentId, setSelectedAgentId] = useState<string>("");
    const [selectedStatuses, setSelectedStatuses] = useState<AgentStatus[]>([]);
    const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phoneNumber: "",
        employeeId: "",
        personId: "",
        groupId: "",
        groupName: "",
        status: AgentStatus.Available
    });

    //const uniqueGroups = Array.from(new Set(agents.map(a => a.groupName).filter(Boolean))) as string[];

    /*
    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    */

    const filteredAgents = agents.filter(agent =>
    {
        const matchesSearch = agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            agent.employeeId?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(agent.status);
        const matchesGroup = selectedGroups.length === 0 || (agent.groupName && selectedGroups.includes(agent.groupName));

        return matchesSearch && matchesStatus && matchesGroup;
    });

    const toggleStatus = (status: AgentStatus) =>
    {
        setSelectedStatuses(prev =>
            prev.includes(status)
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const toggleGroup = (group: string) =>
    {
        setSelectedGroups(prev =>
            prev.includes(group)
                ? prev.filter(g => g !== group)
                : [...prev, group]
        );
    };

    const handleSubmit = (formData: Agent) =>
    {
        console.log("formData");
        console.log(formData);
        /*
        if (editingAgent)
        {
            setAgents(agents.map(agent =>
                agent.id === editingAgent.id
                    ? {
                        ...agent,
                        ...formData,
                        lastActivityAt: new Date().toISOString()
                    }
                    : agent
            ));
        }
        else
        {
            const newAgent: Agent = {
                id: Math.random().toString(36).substring(2, 9),
                ...formData,
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
                createdAt: new Date().toISOString(),
                skillCount: 0,
                activeQueueCount: 0
            };
            setAgents([...agents, newAgent]);
        }
        */
        setIsDialogOpen(false);
    };

    const handleDelete = (id: string) =>
    {
        if (confirm("Bu Müşteri temsilcisini silmek istediğinizden emin misiniz?"))
        {
            setAgents(agents.filter(agent => agent.id !== id));
        }
    };

    const getInitials = (name: string) =>
    {
        return name
            .split(" ")
            .map(n => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const StatusMenu = ({ id, status }: { id: string; status: AgentStatus; }) =>
    {
        const handleValueChange = (value: string) =>
        {
            setAgents(agents =>
                agents.map(agent =>
                    agent.id === id
                        ? {
                            ...agent,
                            status: parseInt(value) as AgentStatus
                        }
                        : agent
                )
            );
        };

        return (
            <Select value={status.toString()} onValueChange={handleValueChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectGroup>
                        {Object.entries(statusLabels).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                                <span className={`w-2 h-2 rounded-full ${statusColors[parseInt(value) as AgentStatus]}`} /> {label}
                            </SelectItem>
                        ))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        );
    };

    return (
        <div className="min-h-full bg-gray-50 p-6">
            <DataList<Agent>
                title="Müşteri Temsilcileri"
                subtitle="Müşteri temsilcilerini görüntüleyin, düzenleyin ve yönetin"
                searchPlaceholder="Müşteri temsilcisi ara (isim, email, çalışan ID)"
                dialogTitleAdd="Yeni Müşteri Temsilcisi Ekle"
                dialogTitleUpdate="Müşteri Temsilcisi Düzenle"
                filters={
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <FilterIcon className="w-4 h-4" />
                                Durum
                                {selectedStatuses.length > 0 && (
                                    <Badge variant="secondary" className="ml-1 rounded-full px-1.5 py-0 text-xs">
                                        {selectedStatuses.length}
                                    </Badge>
                                )}
                                <ChevronDownIcon className="w-4 h-4 ml-auto" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel>Duruma Göre Filtrele</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {Object.entries(statusLabels).map(([value, label]) => (
                                <DropdownMenuCheckboxItem
                                    key={value}
                                    checked={selectedStatuses.includes(parseInt(value) as AgentStatus)}
                                    onCheckedChange={() => toggleStatus(parseInt(value) as AgentStatus)}
                                >
                                    <div className="flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${statusColors[parseInt(value) as AgentStatus]}`} />
                                        {label}
                                    </div>
                                </DropdownMenuCheckboxItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                }
                selectedFilters={
                    <>
                        {selectedStatuses.map((status) => (
                            <Badge key={status} variant="secondary" className="gap-1.5 pl-2 pr-1">
                                <span className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                                {statusLabels[status]}
                                <Button
                                    onClick={() => toggleStatus(status)}
                                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                                    <XIcon className="w-3 h-3" />
                                </Button>
                            </Badge>
                        ))}
                        {selectedGroups.map((group) => (
                            <Badge key={group} variant="secondary" className="gap-1.5 pl-2 pr-1">
                                {group}
                                <Button
                                    onClick={() => toggleGroup(group)}
                                    className="ml-1 hover:bg-gray-200 rounded-full p-0.5">
                                    <XIcon className="w-3 h-3" />
                                </Button>
                            </Badge>
                        ))}
                    </>
                }
                hasActiveFilters={selectedStatuses.length > 0 || selectedGroups.length > 0}
                clearFilters={() =>
                {
                    setSelectedStatuses([]);
                    setSelectedGroups([]);
                }}
                getEmptyData={() => ({
                    id: "",
                    employeeId: undefined,
                    status: AgentStatus.Available,
                    personId: "",
                    avatarUrl: undefined,
                    groupId: undefined,
                    createdAt: "",
                    lastActivityAt: undefined,
                    name: "Yeni",
                    email: "",
                    phoneNumber: undefined,
                    groupName: undefined,
                    skillCount: 0,
                    activeQueueCount: 0
                })}
                columns={[
                    {
                        header: "İsim", field: "name", required: true, onRender: (row) =>
                        (
                            <div className="flex items-center">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={row.avatarUrl} alt={row.name} />
                                    <AvatarFallback>{getInitials(row.name)}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 text-left">
                                    <div className="text-sm font-medium text-gray-900">{row.name}</div>
                                    <div className="text-sm text-gray-500">{row.employeeId || "-"}</div>
                                </div>
                            </div>
                        )
                    },
                    { header: "E-posta", field: "email", required: true },
                    /*
                    <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                        <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
                        {statusLabels[agent.status]}
                    </Badge>
                    */
                    { header: "Telefon", field: "phoneNumber" },
                    { header: "Çalışan Id", field: "employeeId" },
                    //{ header: "Grup", field: {key: "groupId", value: "groupName"}, type: "group" },
                    {
                        header: "Durum", field: "status", onRender: (row) => <StatusMenu id={row.id} status={row.status} />, type: "select",
                        options: Object.entries(statusLabels).map(([value, label]) => ({ value, label }))
                    },

                    /*
                    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ayse"
                    createdAt: "2025-12-18T12:57:35.850987+00:00"
                    email: "aysed@outlook.com"
                    employeeId: null
                    id: "00000000-0000-0000-0000-000000000126"
                    isActive: true
                    isAvailable: true
                    lastActivityAt: null
                    name: "Ayşe Demir"
                    phoneNumber: ""
                    status: 0

                        id: string;
                        employeeId?: string;
                        status: AgentStatus;
                    personId: string;
                        avatarUrl?: string;
                    groupId?: string;
                        createdAt: string;
                        lastActivityAt?: string;
                        name: string;
                        email: string;
                        phoneNumber?: string;
                    groupName?: string;
                    skillCount: number;
                    activeQueueCount: number;
                    */
                    {
                        header: "Beceri / Kuyruk", onRender: (row) =>
                            <div className="flex gap-3 text-sm">
                                <span className="text-gray-900">{row.skillCount} beceri</span>
                                <span className="text-gray-500">|</span>
                                <span className="text-gray-900">{row.activeQueueCount} kuyruk</span>
                            </div>
                    },
                    { header: "", className: "w-[10px]", type: "menu" }
                ]}
                rows={filteredAgents}
                handleSubmit={handleSubmit}
                handleDelete={handleDelete}
            />
        </div>
    );
}