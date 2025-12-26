import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useFetch from "../useFetch"
import { AgentStatus, type Agent } from "../../lib/Models"
import apiClient from "./agentApiClient"
import { useFilter, toFilterOptions } from "../Filter"
import useDialog from "../Dialog"
import DataList from "../DataList"
import { type Column } from "../DataModels"
import { getInitials } from "../../lib/utils"

const allStatuses: Record<AgentStatus, { label: string; color: string }> = {
    [AgentStatus.Available]: { label: "Müsait", color: "bg-green-500" },
    [AgentStatus.Busy]: { label: "Meşgul", color: "bg-red-500" },
    [AgentStatus.OnBreak]: { label: "Mola", color: "bg-yellow-500" },
    [AgentStatus.Training]: { label: "Eğitim", color: "bg-blue-500" },
    [AgentStatus.Inactive]: { label: "Pasif", color: "bg-gray-500" }
};

export default function List()
{
    const { data, setData } =
        useFetch<Agent[]>(async (signal) =>
        {
            const result = await apiClient.getSome(1, 20, signal);
            return result.items;
        },
            []);

    const confirm = useDialog("Are you sure?", "It will be deleted.", ["Ok", "Cancel"]);

    //const filteredQueues = data.filter(queue => queue.id != null);

    const onNew = async (datum: Partial<Agent>) =>
    {
        console.log("onNew");
        console.log(datum);
        const created = await apiClient.create(datum);
        console.log(created);
        setData([...data, created]);

        /*
            const newAgent: Agent = {
                id: Math.random().toString(36).substring(2, 9),
                ...datum,
                avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Math.random()}`,
                createdAt: new Date().toISOString(),
                skillCount: 0,
                activeQueueCount: 0
            };
            setAgents([...agents, newAgent]);

            ////////////////////////

            setData([...data, datum as Agent]);
            await apiClient.create(datum);
        */
    };

    const onEdit = async (updating: Partial<Agent>) =>
    {
        console.log("onEdit");
        console.log(updating);
        const updated = await apiClient.update(updating);
        console.log(updated);
        setData(data.map(old => old.id === updated.id ?
            {
                ...old,
                ...updated,
                lastActivityAt: new Date().toISOString()
            } : old));
    };

    const onDelete = async (id: string) =>
    {
        //confirm.title = "Ne diyosun aslanım?";
        //confirm.description = "Adamı hasta etme!";
        const result = await confirm.show();
        if (result)
        {
            console.log("DELETE...", id);
            //setAgents(agents.filter(agent => agent.id !== id));
            //setAgents(agents.filter(agent => agent.id !== id));
        }
    };

    const createNew = () => ({
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
    });

    const StatusMenu = ({ id, status }: { id: string; status: AgentStatus; }) =>
    {
        const handleValueChange = (value: string) =>
        {
            setData(data =>
                data.map(old =>
                    old.id === id
                        ? {
                            ...old,
                            status: parseInt(value) as AgentStatus
                        }
                        : old
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
                        {Object
                            .entries(allStatuses)
                            .map(([value, { label, color }]) => (
                                <SelectItem key={value} value={value}>
                                    <span className={`w-2 h-2 rounded-full ${color}`} /> {label}
                                </SelectItem>))}
                    </SelectGroup>
                </SelectContent>
            </Select>
        );
    };

    const columns: Column<Agent>[] = [
        {
            label: "İsim", id: "name", required: true, onRender: (row) =>
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
        { label: "E-posta", id: "email", required: true },
        { label: "Telefon", id: "phoneNumber" },
        { label: "Çalışan Id", id: "employeeId" },
        {
            label: "Durum", id: "status",
            onRender: (row) => <StatusMenu id={row.id} status={row.status} />, type: "select",
            options: Object
                .entries(allStatuses)
                .map(([value, { label, color }]) => ({ value, label }))
        },
        /*
        */
        {
            label: "Beceri / Kuyruk", onRender: (row) =>
                <div className="flex gap-3 text-sm">
                    <span className="text-gray-900">{row.skillCount} beceri</span>
                    <span className="text-gray-500">|</span>
                    <span className="text-gray-900">{row.activeQueueCount} kuyruk</span>
                </div>
        },
        { label: "", className: "w-[10px]", type: "menu" }
    ];

    return (
        <div className="min-h-full bg-gray-50 p-6">
            <DataList<Agent>
                title="Müşteri Temsilcileri"
                subtitle="Müşteri temsilcilerini görüntüleyin, düzenleyin ve yönetin"
                titleNew="Müşteri Temsilcisi Ekle"
                titleEdit="Müşteri Temsilcisi Düzenle"
                filters={[
                    useFilter("Durum", toFilterOptions(allStatuses)),
                    useFilter("Kuyruk", toFilterOptions(["Queue1", "Queue2", "Queue3"]))
                ]}
                searchPlaceholder="Müşteri temsilcisi ara (isim, email, çalışan ID)"
                getNewData={createNew}
                columns={columns}
                data={data}
                onNew={onNew}
                onEdit={onEdit}
                onDelete={onDelete} />

            <confirm.Dialog />
        </div>
    );
}