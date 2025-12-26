import { useCallback, useState } from "react";
import
{
    ReactFlow, MiniMap, Controls, Background, MarkerType,
    useNodesState, useEdgesState, addEdge, 
    type Connection, type Node
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface FlowNodeData {
    label: string;
    subtitle?: string;
    icon?: any;
    color?: string;
    showSettings?: boolean;
    showAddButton?: boolean;
}

const CustomNode = ({ data }: { data: FlowNodeData }) =>
{
    return (
        <div className="flex flex-col items-center">
            <div
                className={`w-32 h-32 rounded-3xl flex items-center justify-center shadow-lg ${data.color}`}
                style={{ position: "relative" }}
            >
                <div className="text-white text-5xl font-bold">
                    {data.icon}
                </div>
                {data.showSettings && (
                    <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-xs">⚙️</span>
                    </div>
                )}
                {data.showAddButton && (
                    <div className="absolute -right-6 top-1/2 -translate-y-1/2 w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 text-lg">+</span>
                    </div>
                )}
            </div>
            <div className="mt-4 text-center">
                <div className="font-bold text-lg text-gray-800">{data.label}</div>
                <div className="text-sm text-gray-400">{data.subtitle}</div>
            </div>
        </div>
    );
};

export default function FlowEditor()
{
    const nodeTypes = {
        custom: CustomNode
    };

    const initialNodes: Node[] = [
        {
            id: "1",
            type: "custom",
            position: { x: 50, y: 50 },
            data: {
                label: "Your SaaS",
                subtitle: "New Event",
                icon: "▶",
                color: "bg-indigo-600",
                showSettings: true
            }
        },
        {
            id: "2",
            type: "custom",
            position: { x: 50, y: 400 },
            data: {
                label: "Stripe",
                subtitle: "New Payment Event",
                icon: "S",
                color: "bg-indigo-600",
                showSettings: true
            }
        },
        {
            id: "3",
            type: "custom",
            position: { x: 450, y: 200 },
            data: {
                label: "Salesforce",
                subtitle: "New record in CRM",
                icon: "☁",
                color: "bg-blue-500",
                showSettings: false
            }
        },
        {
            id: "4",
            type: "custom",
            position: { x: 850, y: 50 },
            data: {
                label: "Gmail",
                subtitle: "Send email",
                icon: "M",
                color: "bg-red-500",
                showSettings: true
            }
        },
        {
            id: "5",
            type: "custom",
            position: { x: 850, y: 400 },
            data: {
                label: "Slack",
                subtitle: "Create New Task",
                icon: "#",
                color: "bg-purple-600",
                showAddButton: true
            }
        }
    ];

    const initialEdges = [
        {
            id: "e1-3",
            source: "1",
            target: "3",
            animated: true,
            style: { stroke: "#93c5fd", strokeWidth: 2 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#93c5fd"
            }
        },
        {
            id: "e2-3",
            source: "2",
            target: "3",
            animated: true,
            style: { stroke: "#93c5fd", strokeWidth: 2 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#93c5fd"
            }
        },
        {
            id: "e3-4",
            source: "3",
            target: "4",
            animated: true,
            style: { stroke: "#f87171", strokeWidth: 2 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#f87171"
            }
        },
        {
            id: "e3-5",
            source: "3",
            target: "5",
            animated: true,
            style: { stroke: "#a855f7", strokeWidth: 2 },
            markerEnd: {
                type: MarkerType.ArrowClosed,
                color: "#a855f7"
            }
        }
    ];
    //custom: CustomNode

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [editLabel, setEditLabel] = useState("");

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const addNode = (type: string) =>
    {
        const id = (nodes.length + 1).toString();
        const newNode: Node = {
            id,
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: { label: `${type} Node` },
            type: "default",
        };
        setNodes((nds) => [...nds, newNode]);
    };

    const onNodeClick = (_: any, node: Node) =>
    {
        setSelectedNode(node);
        //setEditLabel(node.data.label);
    };

    const saveNodeLabel = () =>
    {
        if (!selectedNode)
            return;
        setNodes((nds) =>
            nds.map((n) => (n.id === selectedNode.id ? { ...n, data: { ...n.data, label: editLabel } } : n))
        );
        setSelectedNode(null);
    };

    const exportFlow = () =>
    {
        const flow = { nodes, edges };
        console.log("Exported IVR Flow:", flow);
        alert("Akış JSON verisi konsola yazıldı!");
    };

    return (
        <div className="w-full h-full flex flex-col">
            <div className="p-4 flex gap-2 border-b">
                <Button onClick={() => addNode("Menu")}>+ Menü Düğümü</Button>
                <Button onClick={() => addNode("Message")}>+ Mesaj Düğümü</Button>
                <Button onClick={exportFlow} variant="secondary">
                    JSON Dışa Aktar
                </Button>
            </div>

            <div className="flex-1">
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onConnect={onConnect}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={onNodeClick}
                    nodeTypes={nodeTypes}
                    fitView>
                    <MiniMap />
                    <Controls />
                    <Background />
                </ReactFlow>
            </div>

            <Dialog open={!!selectedNode} onOpenChange={() => setSelectedNode(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Düğüm Düzenle</DialogTitle>
                    </DialogHeader>
                    <Card>
                        <CardContent className="space-y-2">
                            <Input
                                value={editLabel}
                                onChange={(e) => setEditLabel(e.target.value)}
                                placeholder="Düğüm adı" />
                            <div className="flex justify-end gap-2 mt-2">
                                <Button onClick={saveNodeLabel}>Kaydet</Button>
                            </div>
                        </CardContent>
                    </Card>
                </DialogContent>
            </Dialog>
        </div>
    );
}
