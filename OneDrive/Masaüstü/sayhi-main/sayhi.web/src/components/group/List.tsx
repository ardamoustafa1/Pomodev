import useFetch from "../useFetch"
import { AgentStatus, GroupType, type Group } from "../../lib/Models"
import apiClient from "./groupApiClient"
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
        useFetch<Group[]>(async (signal) =>
        {
            const result = await apiClient.getSome(1, 20, signal);
            return result.items;
        },
        []);

    const confirm = useDialog("Are you sure?", "It will be deleted.", ["Ok", "Cancel"]);

    const onNew = async (datum: Partial<Group>) =>
    {
        datum.type = parseInt(datum.type?.toString() ?? "0");

        const created = await apiClient.create(datum);
        console.log(created);
        //setData([...data, datum as Group]);
        setData([...data, created]);
    };

    const onEdit = async(datum: Partial<Group>) =>
    {
        datum.type = parseInt(datum.type?.toString() ?? "0");
        
        const updated = await apiClient.update(datum);
        console.log(updated);
        //setData(data.map(group =>
        //    group.id === datum.id
        //        ? {
        //            ...group,
        //            ...datum,
        //            lastActivityAt: new Date().toISOString()
        //        }
        //        : group
        //));
        setData(data.map(i =>
            i.id === updated.id
                //? { ...updated }
                ? updated
                : i));
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
        type: GroupType.None,
        manager: undefined,
        isActive: false
    } as Group);

    const columns: Column<Group>[] = [
        { id: "name", label: "Name", required: true },
        { id: "description", label: "Description" },
        {
            id: "type", label: "Type", required: true, type: "select",
            //onChange: (value) => parseInt(value),
            options: [
                { value: 0, label: "None" },
                { value: 1, label: "Sales" },
                { value: 2, label: "Support" },
                { value: 3, label: "Technical" },
                { value: 4, label: "Specialized" },
                { value: 5, label: "Management" }
            ]
        },
        { id: "isActive", label: "Durum", placeholder: "Aktif mi?", type: "checkbox" }
        //{ id: "startDate", label: "Başlangıç Tarihi", type: "date" }
    ];

    return (
            <div className="min-h-full bg-gray-50 p-6">
                <DataList<Group>
                    title="Gruplar"
                    subtitle="Gruplarları görüntüleyin, düzenleyin ve yönetin"
                    titleNew="Grup Ekle"
                    titleEdit="Grup Düzenle"
                    filters={[
                        useFilter("Durum", toFilterOptions(allStatuses)),
                        useFilter("Grup", toFilterOptions(["Group1", "Group2", "Group3"]))
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

    //const filteredGroups = data.filter(group => group.id != null);
}