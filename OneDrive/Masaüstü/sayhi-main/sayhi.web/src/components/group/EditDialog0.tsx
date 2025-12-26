import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type Property = {
    id: string;
    label: string;
    required?: boolean;
    type?: string;
    placeholder?: string;
}

export default function useEditDialog<T>(properties: Property[])
{
    const [visible, setVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [formData, setFormData] = useState<Partial<T>>({
        //const [formData, setFormData] = useState<T>({
        /*
        name: "",
        description: "",
        type: GroupType.None,
        //manager: un,
        isActive: true,
        */
    } as T);

    const handleSubmit = useCallback(() =>
    {
        /*
        if (editingItem)
        {
            setAgents(agents.map(agent =>
                agent.id === editingItem.id
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
        setVisible(false);
    }, []);

    const getValue = useCallback((
        fieldName: string,
        defaultValue: string = ""
    ): string =>
    {
        const value = formData[fieldName as keyof T];

        if (value == null)
            return defaultValue;

        if (typeof value === "boolean")
            return value ? "true" : "false";

        if (value instanceof Date)
            return value.toISOString();

        return String(value);
    }, [formData]);

    const setValue = useCallback((key: string, value: any) =>
    {
        //setFormData({ ...formData, [key]: value });
        setFormData(prev => ({ ...prev, [key]: value }));
    }, []);

    const EditDialog =  useCallback(() => (
        <Dialog open={visible} onOpenChange={setVisible}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {editingItem ? "Müşteri Temsilcisi Düzenle" : "Yeni Müşteri Temsilcisi Ekle"}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {properties.map(i => (
                        <div className="grid gap-2" key={i.id}>
                            <Label htmlFor={i.id}>{i.label} {i.required && "*"}</Label>
                            <Input id={i.id}
                                value={getValue(i.id)}
                                type={i.type}
                                onChange={(e) => setValue(i.id, e.target.value)}
                                placeholder={i.placeholder ?? i.label} />
                        </div>
                    ))}
                    {/*
                    <div className="grid gap-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name"
                            value={formData["name"]}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Name" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Description" />
                    </div>
                    */}
                </div>
                <DialogFooter>
                    <Button onClick={handleSubmit}>
                        {editingItem ? "Güncelle" : "Ekle"}
                    </Button>
                    <Button variant="outline" onClick={() => setVisible(false)}>
                        İptal
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    ), [visible, getValue, setValue]);

    return {
        //visible,
        //show: setVisible,
        //editingItem,
        //setEditingItem,
        //formData,
        //setFormData,
        openCreateDialog: (_formData: T) =>
        {
            setEditingItem(null);
            /*
            setFormData({
                name: "",
                description: "",
                type: GroupType.None,
                manager: undefined,
                isActive: false
            } as T);
            */
            setFormData(_formData);
            setVisible(true);
        },
        openEditDialog: (item: T) =>
        {
            setEditingItem(item);
            /*
            setFormData({
                name: item.name,
                description: item.description || "",
                type: item.type,
                manager: item.manager ?? undefined,
                isActive: item.isActive
            } as T);
            */
            setFormData(item);
            setVisible(true);
        },
        EditDialog
    };
}