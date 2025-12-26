import useFetch from "../useFetch"
import { AgentStatus, QueueType, type Queue } from "../../lib/Models"
import apiClient from "./queueApiClient"
import { useFilter, toFilterOptions } from "../Filter"
import useDialog from "../Dialog"
import DataList from "../DataList"
import { type Column } from "../DataModels"

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
        useFetch<Queue[]>(async (signal) =>
        {
            const result = await apiClient.getSome(1, 20, signal);
            return result.items;
        },
        []);

    const confirm = useDialog("Are you sure?", "It will be deleted.", ["Ok", "Cancel"]);

    const onNew = async (datum: Partial<Queue>) =>
    {
        setData([...data, datum as Queue]);
        await apiClient.create(datum);
    };

    const onEdit = async(datum: Partial<Queue>) =>
    {
        setData(data.map(queue =>
            queue.id === datum.id
                ? {
                    ...queue,
                    ...datum,
                    lastActivityAt: new Date().toISOString()
                }
                : queue
        ));
        await apiClient.update(datum);
    };

    const onDelete = async (id: string) =>
    {
        const result = await confirm.show();
        if (result)
        {
            console.log("DELETE...", id);
            //setData(data.filter(agent => agent.id !== id));
        }
    };

    const createNew = () => ({
        name: "",
        description: "",
        type: QueueType.None,
        isActive: false
    } as Queue);

    const columns: Column<Queue>[] = [
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
    ];

    return (
            <div className="min-h-full bg-gray-50 p-6">
                <DataList<Queue>
                    title="Kuyruklar"
                    subtitle="Kuyruklarları görüntüleyin, düzenleyin ve yönetin"
                    titleNew="Kuyruk Ekle"
                    titleEdit="Kuyruk Düzenle"
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

    //const filteredQueues = data.filter(queue => queue.id != null);
}