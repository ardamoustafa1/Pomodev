import { useCallback, useState } from "react";
import
{
    ReactFlow, MiniMap, Controls, Background, MarkerType,
    useNodesState, useEdgesState, addEdge,
    type Connection, type Node, type Edge, Handle, Position
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

// Chat akışındaki adım tipleri
export type ChatStepType =
    | "Entry"
    | "Conditions"
    | "Redirect Agent"
    | "Redirect AI"
    | "Join Agent"
    | "Join AI"
    | "Get Chat Data"
    | "Set Chat Data"
    | "Send HTTP Request"
    | "Survey"
    | "Open"
    | "Variable Management"
    | "Log"
    | "Exit"
    | "Send Message" // Eklenen öneri
    | "Wait for Input"; // Eklenen öneri

interface FlowNodeData
{
    label: string;
    type: ChatStepType;
    subtitle?: string;
    icon?: any;
    color?: string;
    showSettings?: boolean;
}

// Her adım tipi için varsayılan konfigürasyon (ikon ve renk)
const STEP_CONFIG: Record<ChatStepType, { icon: string; color: string; subtitle: string }> = {
    "Entry": { icon: "🏁", color: "bg-green-600", subtitle: "Start Flow" },
    "Conditions": { icon: "💎", color: "bg-yellow-500", subtitle: "Logic Check" },
    "Redirect Agent": { icon: "🎧", color: "bg-blue-600", subtitle: "Transfer to Human" },
    "Redirect AI": { icon: "🤖", color: "bg-purple-600", subtitle: "Transfer to Bot" },
    "Join Agent": { icon: "➕🎧", color: "bg-blue-400", subtitle: "Add Agent" },
    "Join AI": { icon: "➕🤖", color: "bg-purple-400", subtitle: "Add Bot" },
    "Get Chat Data": { icon: "📥", color: "bg-cyan-600", subtitle: "Retrieve Info" },
    "Set Chat Data": { icon: "📤", color: "bg-cyan-700", subtitle: "Update Info" },
    "Send HTTP Request": { icon: "🌐", color: "bg-orange-500", subtitle: "API Call" },
    "Survey": { icon: "📋", color: "bg-pink-500", subtitle: "Collect Feedback" },
    "Open": { icon: "🔗", color: "bg-indigo-500", subtitle: "Open URL/Window" },
    "Variable Management": { icon: "🔧", color: "bg-gray-600", subtitle: "Set Variables" },
    "Log": { icon: "📝", color: "bg-gray-500", subtitle: "System Log" },
    "Exit": { icon: "🛑", color: "bg-red-600", subtitle: "End Flow" },
    "Send Message": { icon: "💬", color: "bg-teal-500", subtitle: "Send Text/Media" },
    "Wait for Input": { icon: "⏳", color: "bg-amber-600", subtitle: "Await User" },
};

const CustomNode = ({ data }: { data: FlowNodeData }) =>
{
    return (
        <div className="flex flex-col items-center relative group">
            {/* Giriş Handle'ı - Entry hariç hepsinde olsun */}
            {data.type !== "Entry" && (
                <Handle type="target" position={Position.Top} className="w-3 h-3 bg-gray-500" />
            )}

            <div
                className={`w-40 h-24 rounded-xl flex items-center justify-center shadow-lg ${data.color} transition-transform hover:scale-105 cursor-pointer`}
                style={{ position: "relative" }}
            >
                <div className="text-white text-4xl font-bold drop-shadow-md">
                    {data.icon}
                </div>

                {/* Ayarlar ikonu - hover durumunda görünür */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white/80 text-xs">⚙️</span>
                </div>
            </div>

            <div className="mt-2 text-center bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm border border-gray-100 shadow-sm">
                <div className="font-bold text-sm text-gray-800">{data.label}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">{data.subtitle}</div>
            </div>

            {/* Çıkış Handle'ı - Exit hariç hepsinde olsun */}
            {data.type !== "Exit" && (
                <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-gray-500" />
            )}
        </div>
    );
};

const nodeTypes = {
    custom: CustomNode
};

export default function ChatFlowEditor()
{
    // Başlangıç düğümleri
    const initialNodes: Node[] = [
        {
            id: "start",
            type: "custom",
            position: { x: 250, y: 50 },
            data: {
                label: "Start Chat",
                type: "Entry",
                ...STEP_CONFIG["Entry"]
            }
        }
    ];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const [selectedNodeType, setSelectedNodeType] = useState<ChatStepType>("Send Message");

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({
        ...params,
        animated: true,
        style: { stroke: "#64748b", strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: "#64748b" }
    }, eds)), [setEdges]);

    const addNode = () =>
    {
        const id = `node_${nodes.length + 1}_${Date.now()}`;
        const config = STEP_CONFIG[selectedNodeType];

        const newNode: Node = {
            id,
            position: {
                x: Math.random() * 400 + 100,
                y: Math.random() * 400 + 100
            },
            type: "custom",
            data: {
                label: selectedNodeType,
                type: selectedNodeType,
                ...config
            },
        };
        setNodes((nds) => [...nds, newNode]);
    };

    const onNodeClick = (_: any, node: Node) =>
    {
        setSelectedNode(node);
        setEditLabel(node.data.label as string);
    };

    const saveNodeSettings = () =>
    {
        if (!selectedNode) return;
        setNodes((nds) =>
            nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, label: editLabel } } : n))
        );
        setSelectedNode(null);
    };

    const exportFlow = () =>
    {
        const flow = { nodes, edges };
        console.log("Exported Chat Flow:", flow);
        alert("Chat akışı JSON verisi konsola yazıldı!");
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-50">
            {/* Toolbar */}
            <div className="p-4 flex flex-wrap gap-4 border-b bg-white shadow-sm items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="flex flex-col">
                        <Label className="text-xs text-gray-500 mb-1">Adım Tipi Seçin</Label>
                        <Select
                            value={selectedNodeType}
                            onValueChange={(value) => setSelectedNodeType(value as ChatStepType)}
                        >
                            <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Adım Tipi" />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(STEP_CONFIG).map((type) => (
                                    <SelectItem key={type} value={type}>
                                        <span className="mr-2">{STEP_CONFIG[type as ChatStepType].icon}</span>
                                        {type}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button onClick={addNode} className="mt-4 bg-indigo-600 hover:bg-indigo-700">
                        + Ekle
                    </Button>
                </div>

                <div className="flex items-center gap-2 mt-4">
                    <Button onClick={exportFlow} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                        💾 JSON Kaydet
                    </Button>
                </div>
            </div>

            {/* Flow Canvas */}
            <div className="flex-1 h-full">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onConnect={onConnect}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView
                    className="bg-slate-50"
                >
                    <MiniMap className="border rounded-lg shadow-sm" />
                    <Controls className="bg-white border shadow-sm rounded-lg" />
                    <Background color="#e2e8f0" gap={16} />
                </ReactFlow>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Adım Ayarları: {selectedNode?.data.type as string}</DialogTitle>
                    </DialogHeader>
                    <Card className="border-0 shadow-none">
                        <CardContent className="space-y-4 p-0">
                            <div className="space-y-2">
                                <Label>Etiket (Label)</Label>
                                <Input
                                    value={editLabel}
                                    onChange={(e) => setEditLabel(e.target.value)}
                                    placeholder="Adım adı..."
                                />
                            </div>
                            {/* Buraya her adım tipi için özel ayarlar eklenebilir */}
                            <div className="p-3 bg-blue-50 text-blue-700 text-sm rounded-md">
                                Bu adım için detaylı konfigürasyon alanları buraya gelecek.
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <Button variant="ghost" onClick={() => setSelectedNode(null)}>İptal</Button>
                                <Button onClick={saveNodeSettings}>Değişiklikleri Kaydet</Button>
                            </div>
                        </CardContent>
                    </Card>
                </DialogContent>
            </Dialog>
        </div>
    );
}
