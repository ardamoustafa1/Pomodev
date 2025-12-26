import React, { useState, useCallback, useRef } from "react"
import
{
    ReactFlow, ReactFlowProvider, MiniMap, Controls, Background, Position, Handle, MarkerType,
    useNodesState, useEdgesState, addEdge, //useReactFlow,
    type Connection, type NodeTypes, type Node, type Edge
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import
{
    PhoneIcon, MessageSquareIcon, MenuIcon,
    SaveIcon, PlayIcon, DownloadIcon, UploadIcon, Trash2Icon, PlusIcon, PhoneCallIcon,
    ClockIcon, PhoneForwardedIcon,
    PlusCircleIcon,
    SplitIcon,
    BotIcon,
    GlobeIcon,
    Edit3Icon,
    FileCodeIcon,
    ClipboardListIcon
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import
{
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pin } from "lucide-react"
import { ScriptEditorModal } from "./ScriptEditor"

// Custom Node Components
const StartNode = ({ data }: any) => (
    <div className="px-4 py-2 bg-green-500 text-white rounded-lg border-2 border-green-600 shadow-lg">
        <Handle type="source" position={Position.Bottom} />
        <div className="flex items-center space-x-2">
            <PhoneIcon className="h-4 w-4" />
            <span className="font-semibold">{data.label}</span>
        </div>
    </div>
);

const MessageNode = ({ data, selected }: any) => (
    <div className={`px-4 py-3 bg-white rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-300"} shadow-md min-w-[200px]`}>
        <Handle type="target" position={Position.Top} />
        <div className="space-y-1">
            <div className="flex items-center space-x-2">
                <MessageSquareIcon className="h-4 w-4 text-blue-600" />
                <span className="font-semibold text-sm">{data.label}</span>
            </div>
            <p className="text-xs text-gray-600">{data.message}</p>
        </div>
        <Handle type="source" position={Position.Bottom} />
    </div>
);

const MenuNode = ({ data, selected }: any) => (
    <div className={`px-4 py-3 bg-white rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-300"} shadow-md min-w-[200px]`}>
        <Handle type="target" position={Position.Top} />
        <div className="space-y-2">
            <div className="flex items-center space-x-2">
                <MenuIcon className="h-4 w-4 text-purple-600" />
                <span className="font-semibold text-sm">{data.label}</span>
            </div>
            <div className="space-y-1">
                {/* opt: string yerine opt: any (veya {id, label}) olarak güncellendi */}
                {data.options?.map((opt: any, i: number) => (
                    <div key={opt.id} className="text-xs text-gray-600 flex items-center">
                        <span className="bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded mr-2">{i + 1}</span>
                        {/* Artık obje olduğu için opt.label yazdırılıyor */}
                        {opt.label}
                    </div>
                ))}
            </div>
        </div>
        {
            data.options && data.options.length > 0 && data.options.map((opt: any, i: number) => (
                <Handle
                    key={opt.id}
                    type="source"
                    position={Position.Bottom}
                    // Bağlantı kimliği olarak (i+1) yerine veriden gelen unique ID kullanıldı.
                    // Eğer "1", "2" gibi çıktı istiyorsan burayı id={`${i + 1}`} yapabilirsin.
                    id={opt.id}
                    style={{ left: `${(i + 1) * (100 / (data.options.length + 1))}%` }}
                />
            ))
        }
    </div>
);
const ConditionNode = ({ data, selected }: any) => (
    <div className={`px-4 py-3 bg-white rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-300"} shadow-md min-w-[200px]`}>
        <Handle type="target" position={Position.Top} />
        <div className="space-y-2">
            <div className="flex items-center space-x-2">
                <SplitIcon className="h-4 w-4 text-green-600" />
                <span className="font-semibold text-sm">{data.label}</span>
            </div>
            <div className="space-y-1">
                {/* opt: string yerine opt: any (veya {id, label}) olarak güncellendi */}
                {data.options?.map((opt: any, i: number) => (
                    <div key={opt.id} className="text-xs text-gray-600 flex items-center">
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded mr-2">{i + 1}</span>
                        {/* Artık obje olduğu için opt.label yazdırılıyor */}
                        {opt.label}
                    </div>
                ))}
            </div>
        </div>
        {
            data.options && data.options.length > 0 && data.options.map((opt: any, i: number) => (
                <Handle
                    key={opt.id}
                    type="source"
                    position={Position.Bottom}
                    // Bağlantı kimliği olarak (i+1) yerine veriden gelen unique ID kullanıldı.
                    // Eğer "1", "2" gibi çıktı istiyorsan burayı id={`${i + 1}`} yapabilirsin.
                    id={opt.id}
                    style={{ left: `${(i + 1) * (100 / (data.options.length + 1))}%` }}
                />
            ))
        }
    </div>
);

const QueueNode = ({ data, selected }: any) => (
    <div className={`px-4 py-3 bg-white rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-300"} shadow-md min-w-[180px]`}>
        <Handle type="target" position={Position.Top} />
        <div className="space-y-1">
            <div className="flex items-center space-x-2">
                <ClockIcon className="h-4 w-4 text-orange-600" />
                <span className="font-semibold text-sm">{data.label}</span>
            </div>
            <p className="text-xs text-gray-600">Kuyruk: {data.queue}</p>
        </div>
        <Handle type="source" position={Position.Bottom} />
    </div>
);

const TransferNode = ({ data, selected }: any) => (
    <div className={`px-4 py-3 bg-white rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-300"} shadow-md min-w-[180px]`}>
        <Handle type="target" position={Position.Top} />
        <div className="space-y-1">
            <div className="flex items-center space-x-2">
                <PhoneForwardedIcon className="h-4 w-4 text-indigo-600" />
                <span className="font-semibold text-sm">{data.label}</span>
            </div>
            <p className="text-xs text-gray-600">Numara: {data.number}</p>
        </div>
        <Handle type="source" position={Position.Bottom} />
    </div>
);
const AiNode = ({ data, selected }: any) => (
    <div className={`px-4 py-3 bg-white rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-300"} shadow-md min-w-[180px]`}>
        <Handle type="target" position={Position.Top} />
        <div className="space-y-1">
            <div className="flex items-center space-x-2">
                <BotIcon className="h-4 w-4 text-indigo-600" />
                <span className="font-semibold text-sm">{data.label}</span>
            </div>
            <p className="text-xs text-gray-600">Prompt: {data.prompt.substring(0, 30)}{data.prompt.length > 30 ? "..." : ""}</p>
        </div>
        <Handle type="source" position={Position.Bottom} />
    </div>
);

const ApiNode = ({ data, selected }: any) => (
    <div className={`px-4 py-3 bg-white rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-300"} shadow-md min-w-[180px]`}>
        <Handle type="target" position={Position.Top} />
        <div className="space-y-1">
            <div className="flex items-center space-x-2">
                <GlobeIcon className="h-4 w-4 text-teal-600" />
                <span className="font-semibold text-sm">{data.label}</span>
            </div>
            <p className="text-xs text-gray-600">{data.method} {data.url?.substring(0, 25)}{data.url?.length > 25 ? "..." : ""}</p>
        </div>
        <Handle type="source" position={Position.Bottom} />
    </div>
);

const AssignNode = ({ data, selected }: any) => (
    <div className={`px-4 py-3 bg-white rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-300"} shadow-md min-w-[180px]`}>
        <Handle type="target" position={Position.Top} />
        <div className="space-y-1">
            <div className="flex items-center space-x-2">
                <Edit3Icon className="h-4 w-4 text-amber-600" />
                <span className="font-semibold text-sm">{data.label}</span>
            </div>
            <p className="text-xs text-gray-600">
                {data.assignments && data.assignments.length > 0
                    ? `${data.assignments.length} değişken`
                    : "Değişken yok"}
            </p>
        </div>
        <Handle type="source" position={Position.Bottom} />
    </div>
);

const ScriptNode = ({ data, selected }: any) => (
    <div className={`px-4 py-3 bg-white rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-300"} shadow-md min-w-[180px]`}>
        <Handle type="target" position={Position.Top} />
        <div className="space-y-1">
            <div className="flex items-center space-x-2">
                <FileCodeIcon className="h-4 w-4 text-slate-600" />
                <span className="font-semibold text-sm">{data.label}</span>
            </div>
            <p className="text-xs text-gray-600">JavaScript kodu</p>
        </div>
        <Handle type="source" position={Position.Bottom} />
    </div>
);

const SurveyNode = ({ data, selected }: any) => (
    <div className={`px-4 py-3 bg-white rounded-lg border-2 ${selected ? "border-blue-500" : "border-gray-300"} shadow-md min-w-[180px]`}>
        <Handle type="target" position={Position.Top} />
        <div className="space-y-1">
            <div className="flex items-center space-x-2">
                <ClipboardListIcon className="h-4 w-4 text-cyan-600" />
                <span className="font-semibold text-sm">{data.label}</span>
            </div>
            <p className="text-xs text-gray-600">
                {data.questions && data.questions.length > 0
                    ? `${data.questions.length} soru`
                    : "Soru yok"}
            </p>
        </div>
        <Handle type="source" position={Position.Bottom} />
    </div>
);

const EndNode = ({ data }: any) => (
    <div className="px-4 py-2 bg-red-500 text-white rounded-lg border-2 border-red-600 shadow-lg">
        <Handle type="target" position={Position.Top} />
        <div className="flex items-center space-x-2">
            <PhoneCallIcon className="h-4 w-4" />
            <span className="font-semibold">{data.label}</span>
        </div>
    </div>
);

const nodeTypes: NodeTypes = {
    start: StartNode,
    message: MessageNode,
    menu: MenuNode,
    queue: QueueNode,
    transfer: TransferNode,
    end: EndNode,
    condition: ConditionNode,
    ai: AiNode,
    api: ApiNode,
    assign: AssignNode,
    script: ScriptNode,
    survey: SurveyNode
};

export default function IVRFlowDesigner()
{
    const uniqueId = (): string =>
    {
        // Zaman damgasını ve rastgele sayıyı birleştirir
        return Date.now().toString(36) + Math.random().toString(36).substring(2);
    };
    const [modal, setModal] = useState(false);

    const [chatVars, setChatVars] = useState<{ name: string; value: string }[]>([
        { name: "customer_name", value: '"Ahmet Yılmaz"' },
        { name: "account_balance", value: "2500.50" },
        { name: "customer_tier", value: '"premium"' },
        { name: "user_settings", value: '{"language": "tr", "notifications": true}' },
    ]);


    const [chatFunctions, setChatFunctions] = useState<{ name: string; code: string }[]>([
        {
            name: "Hesap Bakiyesi Sorgulama",
            code: "function getAccountBalance(account_number) { /* ... */ }"
        },
        {
            name: "Son İşlemler",
            code: "function getRecentTransactions(account_number) { /* ... */ }"
        },
    ]);

    const [nodes, setNodes, onNodesChange] = useNodesState([
        {
            id: uniqueId(),
            type: "start",
            position: { x: 250, y: 50 },
            data: { label: "Çağrı Başlangıcı" },
        },
        {
            id: uniqueId(),
            type: "message",
            position: { x: 200, y: 150 },
            data: {
                label: "Karşılama Mesajı",
                message: "Hoş geldiniz. Size nasıl yardımcı olabiliriz?"
            },
        },
        {
            id: uniqueId(),
            type: "menu",
            position: { x: 150, y: 280 },
            data: {
                label: "Ana Menü",
                // options: ["Satış", "Destek", "Faturalandırma"]
                options: [
                    {
                        id: uniqueId(),
                        label: "Satış"
                    },
                    {
                        id: uniqueId(),
                        label: "Destek"
                    },
                    {
                        id: uniqueId(),
                        label: "Faturalandırma"
                    }
                ]
            },
        },
        {
            id: uniqueId(),
            type: "queue",
            position: { x: 50, y: 450 },
            data: {
                label: "Satış Kuyruğu",
                queue: "Satış Ekibi"
            },
        },
        {
            id: uniqueId(),
            type: "queue",
            position: { x: 250, y: 450 },
            data: {
                label: "Destek Kuyruğu",
                queue: "Teknik Destek"
            },
        },
        {
            id: uniqueId(),
            type: "transfer",
            position: { x: 450, y: 450 },
            data: {
                label: "Fatura Yönlendirme",
                number: "+90 555 123 4567"
            },
        },
    ]);

    const [edges, setEdges, onEdgesChange] = useEdgesState([
        {
            id: "e1-2",
            source: "1",
            target: "2",
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed }
        },
        {
            id: "e2-3",
            source: "2",
            target: "3",
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed }
        },
        {
            id: "e3-4",
            source: "3",
            target: "4",
            sourceHandle: "1",
            label: "1",
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed }
        },
        {
            id: "e3-5",
            source: "3",
            target: "5",
            sourceHandle: "2",
            label: "2",
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed }
        },
        {
            id: "e3-6",
            source: "3",
            target: "6",
            sourceHandle: "3",
            label: "3",
            animated: true,
            markerEnd: { type: MarkerType.ArrowClosed }
        },
    ]);
    console.log("Nodes:", nodes);
    console.log("Edges:", edges);

    const [selectedNode, setSelectedNode] = useState<Node<any> | null>(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [leftSidebarPinned, setLeftSidebarPinned] = useState(false);
    const [rightSidebarPinned, setRightSidebarPinned] = useState(false);
    const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
    const [newNodeType, setNewNodeType] = useState("message");
    const reactFlowWrapper = useRef<HTMLDivElement>(null) as React.RefObject<HTMLDivElement>;

    /*
    const onConnects = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, markerEnd: { type: MarkerType.ArrowClosed } }, eds)),
        [setEdges]
    );
    */

    const onConnect = useCallback(
        (params: Connection) =>
        {
            setEdges((prevEdges) =>
            {
                const filteredEdges = prevEdges.filter(edge =>
                {
                    if (edge.source !== params.source) return true;

                    const edgeHandle = edge.sourceHandle || null;
                    const newHandle = params.sourceHandle || null;

                    return edgeHandle !== newHandle;
                });
                return addEdge({
                    ...params,
                    animated: true,
                    markerEnd: { type: MarkerType.ArrowClosed }
                }, filteredEdges);
            });
        },
        [setEdges]
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: Node) =>
    {
        setSelectedNode(node);
    }, []);

    const addNode = (type: string) =>
    {
        const newNode: Node = {
            id: uniqueId(),
            type,
            position: { x: Math.random() * 400, y: Math.random() * 400 },
            data: getNodeData(type),
        };
        setNodes((nds) => [...nds, newNode as any]);
        setNodeDialogOpen(false);
    };

    const getNodeData = (type: string) =>
    {
        switch (type)
        {
            case "message":
                return {
                    label: "Yeni Mesaj",
                    messageType: "static",
                    message: "Mesaj metni buraya...",
                    messageScript: "return 'Merhaba ' + vars.customer_name + ', size nasıl yardımcı olabiliriz?';"
                };
            case "menu":
                return {
                    label: "Ana Menü",
                    // options: ["Satış", "Destek", "Faturalandırma"]
                    options: [
                        {
                            id: uniqueId(),
                            label: "Satış"
                        },
                        {
                            id: uniqueId(),
                            label: "Destek"
                        },
                        {
                            id: uniqueId(),
                            label: "Faturalandırma"
                        }
                    ]
                };
            case "condition":
                return {
                    label: "Koşul Kontrolü",
                    options: [
                        {
                            id: uniqueId(),
                            label: "Premium Müşteri",
                            script: "return vars.customer_tier === 'premium';"
                        },
                        {
                            id: uniqueId(),
                            label: "Yeterli Bakiye",
                            script: "return vars.account_balance > 1000;"
                        },
                        // Default (non-deletable) exit - kept last and has no script
                        {
                            id: uniqueId(),
                            label: "Varsayılan",
                            default: true
                        }
                    ]
                };
            case "queue":
                return { label: "Yeni Kuyruk", queue: "Ekip Adı" };
            case "transfer":
                return { label: "Yeni Yönlendirme", number: "+90 555 000 0000" };
            case "ai":
                return { label: "Yeni Yapay Zeka", prompt: "Sen bir çağrı merkezi botusun ve müşteri ile görüşüp niyetini öğrenmeni istiyorum." };
            case "api":
                return {
                    label: "API İsteği",
                    method: "GET",
                    urlType: "static",
                    url: "https://api.example.com/endpoint",
                    headersScript: 'return {\n  "Content-Type": "application/json"\n};',
                    bodyType: "json",
                    bodyScript: 'return {};',
                    responseVariable: "api_response"
                };
            case "assign":
                return {
                    label: "Değişken Ata",
                    assignments: [
                        { id: uniqueId(), variableName: "", script: "return 'yeni değer';" }
                    ]
                };
            case "script":
                return {
                    label: "Script",
                    script: "// Değişkenleri manipule edin\n// Örnek:\n// vars.customer_tier = 'gold';\n// vars.last_update = new Date().toISOString();\n// vars.total_calls = (parseInt(vars.total_calls) || 0) + 1;"
                };
            case "survey":
                return {
                    label: "Anket",
                    questions: [
                        {
                            id: uniqueId(),
                            questionType: "static",
                            question: "Müşteri memnuniyetinizi nasıl değerlendirirsiniz?",
                            questionScript: "",
                            variableName: "survey_satisfaction"
                        }
                    ]
                };
            case "end":
                return { label: "Çağrı Sonu" };
            default:
                return { label: "Yeni Node" };
        }
    };

    const deleteSelectedNode = () =>
    {
        if (selectedNode)
        {
            setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
            setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
            setSelectedNode(null);
        }
    };

    const updateNodeData = (field: string, value: any) =>
    {
        if (selectedNode)
        {
            setNodes((nds) =>
                nds.map((node) =>
                    node.id === selectedNode.id
                        ? { ...node, data: { ...(node.data as any), [field]: value } }
                        : node
                )
            );
            setSelectedNode((prev) => prev ? { ...prev, data: { ...(prev.data as any), [field]: value } } : null);
        }
    };

    const addMenuOption = () =>
    {
        if (selectedNode && selectedNode.type === "menu")
        {
            const currentOptions = selectedNode.data.options || [];
            const newOptions = [...currentOptions, { id: uniqueId(), label: "Yeni Seçenek" }];
            updateNodeData("options", newOptions);
        }
    };

    const deleteMenuOption = (optionId: string) =>
    {
        if (selectedNode && selectedNode.type === "menu")
        {
            const currentOptions = selectedNode.data.options || [];
            const newOptions = currentOptions.filter((opt: any) => opt.id !== optionId);
            updateNodeData("options", newOptions);
        }
    };

    const addConditionOption = () =>
    {
        if (selectedNode && selectedNode.type === "condition")
        {
            const currentOptions = selectedNode.data.options || [];
            const newOption = { id: uniqueId(), label: "Yeni Koşul", script: "return true;" };
            // If a default exit exists, insert the new option before it so default stays last
            const defaultIndex = currentOptions.findIndex((o: any) => o && o.default);
            let newOptions;
            if (defaultIndex >= 0)
            {
                newOptions = [...currentOptions.slice(0, defaultIndex), newOption, ...currentOptions.slice(defaultIndex)];
            }
            else
            {
                newOptions = [...currentOptions, newOption];
            }
            updateNodeData("options", newOptions);
        }
    };

    const deleteConditionOption = (optionId: string) =>
    {
        if (selectedNode && selectedNode.type === "condition")
        {
            const currentOptions = selectedNode.data.options || [];
            const target = currentOptions.find((opt: any) => opt.id === optionId);
            // Prevent deleting the default exit
            if (target && target.default)
                return;

            const newOptions = currentOptions.filter((opt: any) => opt.id !== optionId);
            updateNodeData("options", newOptions);
        }
    };

    const nodeTemplates = [
        { type: "message", icon: MessageSquareIcon, label: "Mesaj", color: "text-blue-600", bg: "bg-blue-50" },
        { type: "menu", icon: MenuIcon, label: "Menü", color: "text-purple-600", bg: "bg-purple-50" },
        { type: "queue", icon: ClockIcon, label: "Kuyruk", color: "text-orange-600", bg: "bg-orange-50" },
        { type: "transfer", icon: PhoneForwardedIcon, label: "Yönlendir", color: "text-indigo-600", bg: "bg-indigo-50" },
        { type: "end", icon: PhoneCallIcon, label: "Sonlandır", color: "text-red-600", bg: "bg-red-50" },
        { type: "condition", icon: SplitIcon, label: "Koşul", color: "text-green-600", bg: "bg-green-50" },
        { type: "ai", icon: BotIcon, label: "Yapay Zeka", color: "text-pink-600", bg: "bg-pink-50" },
        { type: "api", icon: GlobeIcon, label: "API İsteği", color: "text-teal-600", bg: "bg-teal-50" },
        { type: "assign", icon: Edit3Icon, label: "Değişken Ata", color: "text-amber-600", bg: "bg-amber-50" },
        { type: "script", icon: FileCodeIcon, label: "Script", color: "text-slate-600", bg: "bg-slate-50" },
        { type: "survey", icon: ClipboardListIcon, label: "Anket", color: "text-cyan-600", bg: "bg-cyan-50" }
    ];

    const leftList = [
        { key: "components", label: "Bileşenler" },
        { key: "variables", label: "Değişkenlar" }
    ];
    const [activeLeft, setActiveLeft] = useState(0);

    return (
        <ReactFlowProvider>
            <IVRFlowDesignerInner
                nodes={nodes}
                edges={edges}
                setNodes={setNodes}
                setEdges={setEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                nodeTypes={nodeTypes}
                selectedNode={selectedNode}
                setSelectedNode={setSelectedNode}
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                nodeDialogOpen={nodeDialogOpen}
                setNodeDialogOpen={setNodeDialogOpen}
                newNodeType={newNodeType}
                setNewNodeType={setNewNodeType}
                reactFlowWrapper={reactFlowWrapper}
                chatVars={chatVars}
                setChatVars={setChatVars}
                chatFunctions={chatFunctions}
                setChatFunctions={setChatFunctions}
                modal={modal}
                setModal={setModal}
                addNode={addNode}
                updateNodeData={updateNodeData}
                addMenuOption={addMenuOption}
                deleteMenuOption={deleteMenuOption}
                addConditionOption={addConditionOption}
                deleteConditionOption={deleteConditionOption}
                leftList={leftList}
                activeLeft={activeLeft}
                setActiveLeft={setActiveLeft}
                nodeTemplates={nodeTemplates}
                uniqueId={uniqueId}
                getNodeData={getNodeData}
                deleteSelectedNode={deleteSelectedNode}
                leftSidebarPinned={leftSidebarPinned}
                setLeftSidebarPinned={setLeftSidebarPinned}
                rightSidebarPinned={rightSidebarPinned}
                setRightSidebarPinned={setRightSidebarPinned}
            />
        </ReactFlowProvider>
    );
}

interface IVRFlowDesignerInnerProps
{
    nodes: Node[];
    edges: Edge[];
    setNodes: any;
    setEdges: any;
    onNodesChange: any;
    onEdgesChange: any;
    onConnect: any;
    onNodeClick: any;
    nodeTypes: NodeTypes;
    selectedNode: Node<any> | null;
    setSelectedNode: any;
    sidebarOpen: boolean;
    setSidebarOpen: any;
    nodeDialogOpen: boolean;
    setNodeDialogOpen: any;
    newNodeType: string;
    setNewNodeType: any;
    reactFlowWrapper: React.RefObject<HTMLDivElement>;
    chatVars: any[];
    setChatVars: any;
    chatFunctions: any[];
    setChatFunctions: any;
    modal: any;
    setModal: any;
    addNode: any;
    updateNodeData: any;
    addMenuOption: any;
    deleteMenuOption: any;
    addConditionOption: any;
    deleteConditionOption: any;
    leftList: any[];
    activeLeft: number;
    setActiveLeft: any;
    nodeTemplates: any[];
    uniqueId: () => string;
    getNodeData: (type: string) => any;
    deleteSelectedNode: () => void;
    leftSidebarPinned: boolean;
    setLeftSidebarPinned: any;
    rightSidebarPinned: boolean;
    setRightSidebarPinned: any;
}

function IVRFlowDesignerInner(props: IVRFlowDesignerInnerProps)
{
    //const reactFlow = useReactFlow();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    // Props destruct
    const {
        nodes, setNodes, edges, /*setEdges,*/ onNodesChange, onEdgesChange, onConnect, onNodeClick,
        nodeTypes, selectedNode, setSelectedNode, sidebarOpen, setSidebarOpen,
        /*nodeDialogOpen, setNodeDialogOpen, newNodeType,*/ setNewNodeType,
        chatVars, setChatVars, chatFunctions, setChatFunctions, /*modal, setModal,*/
        addNode, updateNodeData, /*addMenuOption, deleteMenuOption,*/ addConditionOption, deleteConditionOption,
        leftList, activeLeft: activeLeftProp, /*setActiveLeft: setActiveLeftProp,*/ nodeTemplates, uniqueId, getNodeData, deleteSelectedNode,
        leftSidebarPinned, setLeftSidebarPinned, rightSidebarPinned, setRightSidebarPinned
    } = props;

    const [activeLeft, setActiveLeft] = useState(activeLeftProp);

    // Condition script tester state: stores input JSON and last result per option id
    //const [conditionTests, setConditionTests] = useState<Record<string, { input: string; result?: string }>>({});

    /*
    const runConditionTest = (optionId: string) =>
    {
        if (!selectedNode)
            return;
        const option = (selectedNode.data.options || []).find((o: any) => o.id === optionId);
        if (!option)
            return;

        const script = option.script || "";
        const entry = conditionTests[optionId] || { input: '{}' };

        let parsedInput: any = {};
        try
        {
            parsedInput = entry.input ? JSON.parse(entry.input) : {};
        }
        catch (err)
        {
            setConditionTests(prev => ({ ...prev, [optionId]: { ...entry, result: 'JSON parse error: ' + (err as any).message } }));
            return;
        }

        // Build context object from chatVars - map name (key) to value
        const contextVars: Record<string, any> = {};
        chatVars.forEach((v: any) =>
        {
            // Try to parse value as JSON (number, object, array, etc)
            let parsedValue: any = v.value;
            try
            {
                parsedValue = JSON.parse(v.value);
            }
            catch
            {
                // If not valid JSON, keep as string
                parsedValue = v.value;
            }
            contextVars[v.name] = parsedValue;
        });

        try
        {
            // Create proxy that tracks undefined variable access
            const handler = {
                get: (target: any, prop: string | symbol) =>
                {
                    if (typeof prop === 'string' && !(prop in target))
                    {
                        throw new ReferenceError(`Tanımlanmamış değişken: "${prop}". Mevcut değişkenler: ${Object.keys(target).join(', ') || 'yok'}`);
                    }
                    return target[prop];
                }
            };
            const proxiedInput = new Proxy(parsedInput, handler);
            const proxiedVars = new Proxy(contextVars, handler);

            // eslint-disable-next-line no-new-func
            const fn = new Function('input', 'vars', script + '\nreturn input;');
            const res = fn(proxiedInput, proxiedVars);
            setConditionTests(prev => ({ ...prev, [optionId]: { ...entry, result: typeof res === 'string' ? res : JSON.stringify(res) } }));
        }
        catch (err)
        {
            setConditionTests(prev => ({ ...prev, [optionId]: { ...entry, result: 'Hata: ' + (err as any).message } }));
        }
    };
    */

    const handleCanvasClick = () =>
    {
        if (!leftSidebarPinned) setSidebarOpen(false);
        if (selectedNode && !rightSidebarPinned) setSelectedNode(null);
    };

    return (
        <div
            className="flex w-full h-full bg-gray-50"
            onDragOver={(e) =>
            {
                console.log("Main container: dragover");
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) =>
            {
                console.log("Main container: drop event fired!");
                e.preventDefault();
                e.stopPropagation();

                const data = e.dataTransfer.getData("application/reactflow");
                console.log("Data from transfer:", data);

                try
                {
                    const { type } = JSON.parse(data);

                    // Pane'i al (transform'un uygulandığı element)
                    const pane = document.querySelector(".react-flow__pane") as HTMLElement;
                    // Wrapper'ı al (ReactFlow'un container'ı)
                    const wrapper = document.querySelector("[data-testid='rf__wrapper']") as HTMLElement;

                    if (!pane || !wrapper)
                    {
                        console.error("Pane or wrapper element not found");
                        return;
                    }

                    // Wrapper'ın bounding rect'ini al
                    const wrapperRect = wrapper.getBoundingClientRect();

                    // Mouse pozisyonunu wrapper'a göre hesapla
                    const x = e.clientX - wrapperRect.left;
                    const y = e.clientY - wrapperRect.top;

                    // Pane'in transform'unu al
                    const paneStyle = window.getComputedStyle(pane);
                    const transform = paneStyle.transform;

                    let scale = 1;
                    let translateX = 0;
                    let translateY = 0;

                    // matrix(a, b, c, d, e, f) parse
                    if (transform && transform !== 'none')
                    {
                        const match = transform.match(/matrix(?:3d)?\(([^)]+)\)/);
                        if (match)
                        {
                            const values = match[1].split(',').map(v => parseFloat(v.trim()));

                            if (transform.includes('matrix3d'))
                            {
                                scale = values[0];
                                translateX = values[12];
                                translateY = values[13];
                            }
                            else
                            {
                                scale = values[0];
                                translateX = values[4];
                                translateY = values[5];
                            }
                        }
                    }

                    console.log("Wrapper rect:", wrapperRect);
                    console.log("Mouse - e.clientX:", e.clientX, "e.clientY:", e.clientY);
                    console.log("Transform values - scale:", scale, "tx:", translateX, "ty:", translateY);
                    console.log("x, y relative to wrapper:", x, y);

                    // Flow koordinatlarına dönüştür
                    // Transform ters yönde uygulanmalı: (x + tx) / scale yerine (x - tx) / scale
                    const position = {
                        x: (x + translateX) / scale,
                        y: (y + translateY) / scale,
                    };

                    const newNode: Node = {
                        id: uniqueId(),
                        type,
                        position,
                        data: getNodeData(type),
                    };

                    console.log("✅ Node dropped at flow coords:", position, "Type:", type);
                    setNodes((nds: Node[]) => [...nds, newNode as any]);
                }
                catch (error)
                {
                    console.error("❌ Drop error:", error);
                }
            }}
        >
            {/* Left Sidebar - Node Palette */}
            <div className={`${sidebarOpen ? "w-80" : "w-0"} bg-white border-r border-gray-200 transition-all duration-300 overflow-hidden`}>
                <div className="p-4 h-full flex flex-col">
                    {/* Header: tab controls */}
                    <div className="flex items-center justify-between mb-3 px-2">
                        <div className="flex items-center gap-2">

                            <div className="flex space-x-1 bg-slate-50 rounded-md p-1">
                                {leftList.map((item, idx) => (
                                    <button
                                        key={item.key}
                                        onClick={() => setActiveLeft(idx)}
                                        className={`px-3 py-1 rounded text-sm ${activeLeft === idx ? 'bg-white shadow-sm font-semibold' : 'text-gray-600 hover:bg-slate-100'}`}
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => setLeftSidebarPinned(!leftSidebarPinned)}
                            className={`p-1 rounded hover:bg-gray-200 transition ${leftSidebarPinned ? 'text-blue-600' : 'text-gray-400'}`}
                            title={leftSidebarPinned ? "Sabitle kaldır" : "Sabitle"}
                        >
                            <Pin className="h-4 w-4" style={{ transform: leftSidebarPinned ? 'rotate(45deg)' : 'rotate(0deg)' }} />
                        </button>
                    </div>

                    <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
                        <div className="p-2">
                            {activeLeft === 0 && (
                                <div className="space-y-2">
                                    {nodeTemplates.map((template) =>
                                    {
                                        const Icon = template.icon;
                                        return (
                                            <button
                                                key={template.type}
                                                draggable
                                                onDragStart={(e) =>
                                                {
                                                    e.dataTransfer.effectAllowed = "move";
                                                    e.dataTransfer.setData("application/reactflow", JSON.stringify({ type: template.type }));
                                                }}
                                                onClick={() =>
                                                {
                                                    setNewNodeType(template.type);
                                                    addNode(template.type);
                                                }}
                                                className={`w-full flex items-center space-x-3 p-3 rounded-lg ${template.bg} hover:opacity-95 transition border border-transparent hover:border-gray-100 cursor-move`}
                                            >
                                                <Icon className={`h-5 w-5 ${template.color}`} />
                                                <span className="font-medium">{template.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {activeLeft === 1 && (
                                <div className="space-y-3">
                                    {chatVars.map((variable, idx) =>
                                    {
                                        const isValidName = (name: string) =>
                                        {
                                            // Allow only alphanumeric, underscore, dash (no spaces, no Turkish characters)
                                            return /^[a-zA-Z0-9_-]*$/.test(name);
                                        };
                                        const nameError = variable.name && !isValidName(variable.name);

                                        // Validate value as valid JSON or simple value
                                        let valueError = false;
                                        let valueErrorMsg = '';
                                        if (variable.value && variable.value.trim())
                                        {
                                            try
                                            {
                                                JSON.parse(variable.value);
                                            }
                                            catch (err)
                                            {
                                                valueError = true;
                                                valueErrorMsg = 'Geçersiz JSON formatı: ' + (err as any).message;
                                            }
                                        }

                                        return (
                                            <div key={idx} className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                                <div className="flex items-center justify-end mb-2">
                                                    <Button
                                                        onClick={() => setChatVars(chatVars.filter((_, i) => i !== idx))}
                                                        className="text-xs text-red-500 hover:text-red-700 transition cursor-pointer"
                                                    >
                                                        <Trash2Icon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <div className="space-y-2">
                                                    <div>
                                                        <Label htmlFor={`var-name-${idx}`} className="text-xs">Adı</Label>
                                                        <Input
                                                            id={`var-name-${idx}`}
                                                            value={variable.name}
                                                            onChange={(e) =>
                                                            {
                                                                const newVars = [...chatVars];
                                                                newVars[idx] = { ...newVars[idx], name: e.target.value };
                                                                setChatVars(newVars);
                                                            }}
                                                            placeholder="Sadece İngilizce: a-z, A-Z, 0-9, -, _"
                                                            className={`mt-1 text-sm ${nameError ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                        />
                                                        {nameError && (
                                                            <p className="text-xs text-red-600 mt-1">Değişken Adı geçersiz</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <Label htmlFor={`var-value-${idx}`} className="text-xs">Değeri (string, number veya JSON obje)</Label>
                                                        <Textarea
                                                            id={`var-value-${idx}`}
                                                            value={variable.value}
                                                            onChange={(e) =>
                                                            {
                                                                const newVars = [...chatVars];
                                                                newVars[idx] = { ...newVars[idx], value: e.target.value };
                                                                setChatVars(newVars);
                                                            }}
                                                            placeholder='Örnek: "metin" veya 123 veya {"key": "value"}'
                                                            className={`mt-1 text-sm font-mono ${valueError ? 'border-red-500 focus:ring-red-500' : ''}`}
                                                            rows={3}
                                                        />
                                                        {valueError && (
                                                            <p className="text-xs text-red-600 mt-1">{valueErrorMsg}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div className="pt-2">
                                        <Button size="sm" variant="outline" className="w-full" onClick={() => setChatVars([...chatVars, { name: `new_variable_${chatVars.length + 1}`, value: '""' }])}>
                                            <PlusIcon className="h-4 w-4 mr-2" />
                                            Yeni Değişken Ekle
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {activeLeft === 2 && (
                                <div className="space-y-3">
                                    {chatFunctions.map((fn) => (
                                        <div key={fn.name} className="mb-3">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-sm">{fn.name}</Label>
                                                <button className="text-xs text-red-500" onClick={() => setChatFunctions(chatFunctions.filter(f => f.name !== fn.name))}>Sil</button>
                                            </div>
                                            <Textarea
                                                id={`fn-${fn.name}`}
                                                value={fn.code}
                                                onChange={(e) =>
                                                {
                                                    const newFns = chatFunctions.map(f => f.name === fn.name ? { ...f, code: e.target.value } : f);
                                                    setChatFunctions(newFns);
                                                }}
                                                rows={6}
                                                className="mt-1 font-mono text-sm"
                                            />
                                        </div>
                                    ))}
                                    <div className="pt-2">
                                        <Button size="sm" variant="outline" onClick={() => setChatFunctions([...chatFunctions, { name: `Fonksiyon ${chatFunctions.length + 1}`, code: '// yeni fonksiyon' }])}>
                                            Yeni Fonksiyon Ekle
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>

            {/* Main Canvas */}
            <div className="flex-1 flex flex-col">
                {/* Top Toolbar */}
                <div className="bg-white border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                            >
                                <MenuIcon className="h-5 w-5" />
                            </Button>
                            <h1 className="text-xl font-bold">IVR Akış Tasarımı</h1>
                        </div>

                        {/* <div>
                            <div className="border-2 p-1 rounded-sm border-black">
                                <Variable onClick={() => {
                                    setModal(true)
                                }} />
                            </div>
                        </div> */}

                        <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm">
                                <UploadIcon className="h-4 w-4 mr-2" />
                                İçe Aktar
                            </Button>
                            <Button variant="outline" size="sm">
                                <DownloadIcon className="h-4 w-4 mr-2" />
                                Dışa Aktar
                            </Button>
                            <Button variant="outline" size="sm">
                                <PlayIcon className="h-4 w-4 mr-2" />
                                Test Et
                            </Button>
                            <Button size="sm">
                                <SaveIcon className="h-4 w-4 mr-2" />
                                Kaydet
                            </Button>
                        </div>
                    </div>
                </div>

                {/* React Flow Canvas */}
                <div
                    className="flex-1 relative"
                    ref={reactFlowWrapper}
                    onClick={handleCanvasClick}
                >
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        fitView
                    >
                        <Background />
                        <Controls />
                        <MiniMap
                            nodeColor={(node) =>
                            {
                                switch (node.type)
                                {
                                    case "start": return "#10b981";
                                    case "message": return "#3b82f6";
                                    case "menu": return "#a855f7";
                                    case "queue": return "#f97316";
                                    case "transfer": return "#6366f1";
                                    case "end": return "#ef4444";
                                    case "assign": return "#f59e0b";
                                    case "script": return "#64748b";
                                    case "survey": return "#06b6d4";
                                    default: return "#9ca3af";
                                }
                            }}
                        />
                    </ReactFlow>
                </div>
                {/*
                <DetailModal modal={modal} setModal={setModal} />
                */}
            </div>

            {/* Right Sidebar - Properties */}
            <div className={`${selectedNode && rightSidebarPinned ? "w-80" : selectedNode && !rightSidebarPinned ? "w-80" : "w-0"} bg-white border-l border-gray-200 transition-all duration-300 overflow-hidden`}>
                {selectedNode && (
                    <div className="p-4 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-lg font-bold">Özellikler</h2>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setRightSidebarPinned(!rightSidebarPinned)}
                                    className={rightSidebarPinned ? 'text-blue-600' : 'text-gray-400'}
                                    title={rightSidebarPinned ? "Sabitle kaldır" : "Sabitle"}
                                >
                                    <Pin className="h-4 w-4" style={{ transform: rightSidebarPinned ? 'rotate(45deg)' : 'rotate(0deg)' }} />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={deleteSelectedNode}
                                >
                                    <Trash2Icon className="h-4 w-4 text-red-600" />
                                </Button>
                            </div>
                        </div>

                        <Separator />

                        <ScrollArea className="h-[calc(100vh-10rem)]">
                            <div className="space-y-4 pr-3 overflow-x-hidden">
                                <div>
                                    <Label>Node Tipi</Label>
                                    <p className="text-sm text-gray-600 mt-1 capitalize">{selectedNode.type}</p>
                                </div>

                                <div>
                                    <Label htmlFor="label">Etiket</Label>
                                    <Input
                                        id="label"
                                        value={selectedNode.data.label}
                                        onChange={(e) => updateNodeData("label", e.target.value)}
                                        className="mt-1"
                                    />
                                </div>

                                {selectedNode.type === "message" && (
                                    <div className="space-y-3">
                                        <div>
                                            <Label htmlFor="message-type">Mesaj Tipi</Label>
                                            <Select
                                                value={selectedNode.data.messageType || "static"}
                                                onValueChange={(value) => updateNodeData("messageType", value)}
                                            >
                                                <SelectTrigger id="message-type" className="mt-1">
                                                    <SelectValue placeholder="Tip seçin" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="static">Statik</SelectItem>
                                                    <SelectItem value="dynamic">Dinamik (Script)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {(selectedNode.data.messageType === "static" || !selectedNode.data.messageType) && (
                                            <div>
                                                <Label htmlFor="message">Mesaj</Label>
                                                <Textarea
                                                    id="message"
                                                    value={selectedNode.data.message}
                                                    onChange={(e) => updateNodeData("message", e.target.value)}
                                                    rows={4}
                                                    className="mt-1"
                                                />
                                            </div>
                                        )}
                                        {selectedNode.data.messageType === "dynamic" && (
                                            <div>
                                                <ScriptEditorModal
                                                    value={selectedNode.data.messageScript || ""}
                                                    onChange={(value) => updateNodeData("messageScript", value)}
                                                    label="Mesaj Scripti"
                                                    placeholder="return 'Merhaba ' + vars.customer_name + ', size nasıl yardımcı olabiliriz?';"
                                                    variables={chatVars}
                                                    functions={chatFunctions}
                                                    triggerLabel="Mesaj Script Düzenle"
                                                />
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Script bir string döndürmelidir. Değişkenlere göre dinamik mesaj oluşturabilirsiniz.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {selectedNode.type === "menu" && (
                                    <div className="space-y-2 mt-2">
                                        {selectedNode.data.options?.map((option: { id: string, label: string }, i: number) => (
                                            // DİKKAT: Key olarak artık index değil, elimizdeki unique ID'yi kullanıyoruz.
                                            // Bu, inputa yazı yazarken odağın kaybolmasını engeller.
                                            <div key={option.id} className="flex items-center gap-2">
                                                <Input
                                                    value={option.label} // DEĞİŞİKLİK 1: option yerine option.label
                                                    onChange={(e) =>
                                                    {
                                                        const newOptions = [...selectedNode.data.options];
                                                        // DEĞİŞİKLİK 2: Sadece stringi değil, objenin label kısmını güncelliyoruz
                                                        // ID sabit kalmalı!
                                                        newOptions[i] = {
                                                            ...newOptions[i],
                                                            label: e.target.value
                                                        };
                                                        updateNodeData("options", newOptions);
                                                    }}
                                                    placeholder={`Seçenek ${i + 1}`}
                                                    className="flex-1"
                                                />

                                                {/* Silme Butonu */}
                                                <button
                                                    onClick={() =>
                                                    {
                                                        // Index yerine ID'ye göre filtrelemek daha güvenlidir ama index de çalışır.
                                                        // Biz yine de mevcut mantığı koruyarak index ile devam edelim:
                                                        const newOptions = selectedNode.data.options.filter((_: any, index: number) => index !== i);
                                                        updateNodeData("options", newOptions);
                                                    }}
                                                    disabled={selectedNode.data.options.length <= 1}
                                                    className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                                    title="Seçeneği Sil"
                                                >
                                                    <Trash2Icon size={18} />
                                                </button>
                                            </div>
                                        ))}

                                        {/* Ekleme Butonu */}
                                        <div className="flex justify-center mt-2">
                                            <PlusCircleIcon
                                                className="cursor-pointer text-gray-500 hover:text-blue-500 transition-colors"
                                                size={24}
                                                onClick={() =>
                                                {
                                                    const currentOptions = selectedNode.data.options || [];

                                                    // DEĞİŞİKLİK 3: Yeni eklerken string değil, ID'li OBJE ekliyoruz.
                                                    // uniqueId fonksiyonunu burada çağırıyoruz.
                                                    const newOption = {
                                                        id: uniqueId(), // Sizin için belirlediğimiz kısa ID yöntemi
                                                        label: `Seçenek ${currentOptions.length + 1}`
                                                    };

                                                    const newOptions = [...currentOptions, newOption];
                                                    updateNodeData("options", newOptions);
                                                }}
                                            />
                                        </div>
                                    </div>
                                )}
                                {selectedNode.type === "condition" && (
                                    <div className="space-y-3 mt-2">
                                        {selectedNode.data.options?.map((option: { id: string, label: string, script?: string, default?: boolean }, i: number) => (
                                            <div key={option.id} className="p-2 bg-gray-50 rounded border border-gray-200">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Label className="text-xs">Etiket</Label>
                                                            {option.default && (
                                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Varsayılan</span>
                                                            )}
                                                        </div>
                                                        <Input
                                                            value={option.label}
                                                            readOnly={!!option.default}
                                                            onChange={(e) =>
                                                            {
                                                                const newOptions = [...selectedNode.data.options];
                                                                newOptions[i] = { ...newOptions[i], label: e.target.value };
                                                                updateNodeData("options", newOptions);
                                                            }}
                                                            placeholder={`Seçenek ${i + 1}`}
                                                            className={`mt-1 text-sm ${option.default ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                        />
                                                    </div>
                                                    <div className="flex-shrink-0 ml-2">
                                                        <button
                                                            onClick={() => deleteConditionOption(option.id)}
                                                            disabled={option.default || selectedNode.data.options.length <= 1}
                                                            className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                                            title={option.default ? "Bu seçenek varsayılan olduğu için silinemez" : "Seçeneği Sil"}
                                                        >
                                                            <Trash2Icon size={18} />
                                                        </button>
                                                    </div>
                                                </div>

                                                {!option.default ? (
                                                    <div className="mt-2 space-y-2">
                                                        <ScriptEditorModal
                                                            value={option.script || ""}
                                                            onChange={(value) =>
                                                            {
                                                                const newOptions = [...selectedNode.data.options];
                                                                newOptions[i] = { ...newOptions[i], script: value };
                                                                updateNodeData("options", newOptions);
                                                            }}
                                                            label="Mantıksal İfade Scripti"
                                                            placeholder="return vars.customer_tier === 'premium';"
                                                            variables={chatVars}
                                                            functions={chatFunctions}
                                                            triggerLabel="Mantıksal İfade Düzenle"
                                                            testMode={true}
                                                            onRunTest={(script, testInputStr) =>
                                                            {
                                                                let parsedInput: any = {};
                                                                try
                                                                {
                                                                    parsedInput = testInputStr ? JSON.parse(testInputStr) : {};
                                                                }
                                                                catch (err)
                                                                {
                                                                    return { success: false, result: 'JSON parse error: ' + (err as any).message };
                                                                }

                                                                // Build context object from chatVars
                                                                const contextVars: Record<string, any> = {};
                                                                chatVars.forEach((v: any) =>
                                                                {
                                                                    let parsedValue: any = v.value;
                                                                    try
                                                                    {
                                                                        parsedValue = JSON.parse(v.value);
                                                                    }
                                                                    catch
                                                                    {
                                                                        parsedValue = v.value;
                                                                    }
                                                                    contextVars[v.name] = parsedValue;
                                                                });

                                                                try
                                                                {
                                                                    const handler = {
                                                                        get: (target: any, prop: string | symbol) =>
                                                                        {
                                                                            if (typeof prop === 'string' && !(prop in target))
                                                                            {
                                                                                throw new ReferenceError(`Tanımlanmamış değişken: "${prop}". Mevcut değişkenler: ${Object.keys(target).join(', ') || 'yok'}`);
                                                                            }
                                                                            return target[prop];
                                                                        }
                                                                    };
                                                                    const proxiedInput = new Proxy(parsedInput, handler);
                                                                    const proxiedVars = new Proxy(contextVars, handler);

                                                                    const fn = new Function('input', 'vars', script);
                                                                    const res = fn(proxiedInput, proxiedVars);
                                                                    return { success: true, result: typeof res === 'string' ? res : JSON.stringify(res) };
                                                                }
                                                                catch (err)
                                                                {
                                                                    return { success: false, result: 'Hata: ' + (err as any).message };
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 text-xs text-gray-600">Bu seçenek varsayılan çıkıştır; diğer seçenekler false olduğunda akış buradan devam eder.</div>
                                                )}
                                            </div>
                                        ))}

                                        <div className="flex justify-center mt-2">
                                            <PlusCircleIcon
                                                className="cursor-pointer text-gray-500 hover:text-blue-500 transition-colors"
                                                size={24}
                                                onClick={() => addConditionOption()}
                                            />
                                        </div>
                                    </div>
                                )}

                                {selectedNode.type === "queue" && (
                                    <div>
                                        <Label htmlFor="queue">Kuyruk Adı</Label>
                                        <Input
                                            id="queue"
                                            value={selectedNode.data.queue}
                                            onChange={(e) => updateNodeData("queue", e.target.value)}
                                            className="mt-1"
                                        />
                                    </div>
                                )}

                                {selectedNode.type === "transfer" && (
                                    <div>
                                        <Label htmlFor="number">Telefon Numarası</Label>
                                        <Input
                                            id="number"
                                            value={selectedNode.data.number}
                                            onChange={(e) => updateNodeData("number", e.target.value)}
                                            className="mt-1"
                                            placeholder="+90 555 000 0000"
                                        />
                                    </div>
                                )}

                                {selectedNode.type === "ai" && (
                                    <div>
                                        <Label htmlFor="prompt">Prompt</Label>
                                        <Textarea
                                            id="prompt"
                                            value={selectedNode.data.prompt}
                                            onChange={(e) => updateNodeData("prompt", e.target.value)}
                                            className="mt-1 w-full p-2 border border-gray-300 rounded-md"
                                            rows={4} />
                                    </div>
                                )}

                                {selectedNode.type === "assign" && (
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold">Değişken Atamaları</Label>
                                        {selectedNode.data.assignments?.map((assignment: any, i: number) => (
                                            <div key={assignment.id} className="p-3 bg-gray-50 rounded border border-gray-200 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold">Atama {i + 1}</Label>
                                                    <button
                                                        onClick={() =>
                                                        {
                                                            const newAssignments = selectedNode.data.assignments.filter((_: any, index: number) => index !== i);
                                                            updateNodeData("assignments", newAssignments);
                                                        }}
                                                        disabled={selectedNode.data.assignments.length <= 1}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                                        title="Atamayı Sil"
                                                    >
                                                        <Trash2Icon size={16} />
                                                    </button>
                                                </div>
                                                <div>
                                                    <Label htmlFor={`assign-variable-${i}`} className="text-xs">Değişken</Label>
                                                    <Select
                                                        value={assignment.variableName || ""}
                                                        onValueChange={(value) =>
                                                        {
                                                            const newAssignments = [...selectedNode.data.assignments];
                                                            newAssignments[i] = { ...newAssignments[i], variableName: value };
                                                            updateNodeData("assignments", newAssignments);
                                                        }}
                                                    >
                                                        <SelectTrigger id={`assign-variable-${i}`} className="mt-1">
                                                            <SelectValue placeholder="Değişken seçin" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {chatVars.map((v: any) => (
                                                                <SelectItem key={v.name} value={v.name}>
                                                                    {v.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div>
                                                    <ScriptEditorModal
                                                        value={assignment.script || ""}
                                                        onChange={(value) =>
                                                        {
                                                            const newAssignments = [...selectedNode.data.assignments];
                                                            newAssignments[i] = { ...newAssignments[i], script: value };
                                                            updateNodeData("assignments", newAssignments);
                                                        }}
                                                        label={`Atama ${i + 1} Scripti`}
                                                        placeholder="return 'yeni değer';"
                                                        variables={chatVars}
                                                        functions={chatFunctions}
                                                        triggerLabel="Script Düzenle"
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex justify-center mt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                {
                                                    const currentAssignments = selectedNode.data.assignments || [];
                                                    const newAssignment = {
                                                        id: uniqueId(),
                                                        variableName: "",
                                                        script: "return 'yeni değer';"
                                                    };
                                                    updateNodeData("assignments", [...currentAssignments, newAssignment]);
                                                }}
                                                className="w-full"
                                            >
                                                <PlusCircleIcon className="h-4 w-4 mr-2" />
                                                Yeni Atama Ekle
                                            </Button>
                                        </div>
                                        {chatVars.length === 0 && (
                                            <p className="text-xs text-gray-500 text-center mt-2">Sol panelden değişken ekleyin</p>
                                        )}
                                        <p className="text-xs text-gray-500 mt-2">
                                            Her script bir return ifadesi içermelidir. vars objesi ile diğer değişkenlere erişebilirsiniz.
                                        </p>
                                    </div>
                                )}

                                {selectedNode.type === "survey" && (
                                    <div className="space-y-3">
                                        <Label className="text-sm font-semibold">Anket Soruları</Label>
                                        {selectedNode.data.questions?.map((question: any, i: number) => (
                                            <div key={question.id} className="p-3 bg-gray-50 rounded border border-gray-200 space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="text-xs font-semibold">Soru {i + 1}</Label>
                                                    <button
                                                        onClick={() =>
                                                        {
                                                            const newQuestions = selectedNode.data.questions.filter((_: any, index: number) => index !== i);
                                                            updateNodeData("questions", newQuestions);
                                                        }}
                                                        disabled={selectedNode.data.questions.length <= 1}
                                                        className="text-gray-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                                                        title="Soruyu Sil"
                                                    >
                                                        <Trash2Icon size={16} />
                                                    </button>
                                                </div>

                                                <div>
                                                    <Label htmlFor={`question-type-${i}`} className="text-xs">Soru Tipi</Label>
                                                    <Select
                                                        value={question.questionType || "static"}
                                                        onValueChange={(value) =>
                                                        {
                                                            const newQuestions = [...selectedNode.data.questions];
                                                            newQuestions[i] = { ...newQuestions[i], questionType: value };
                                                            updateNodeData("questions", newQuestions);
                                                        }}
                                                    >
                                                        <SelectTrigger id={`question-type-${i}`} className="mt-1">
                                                            <SelectValue placeholder="Tip seçin" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="static">Statik</SelectItem>
                                                            <SelectItem value="dynamic">Dinamik (Script)</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                {(question.questionType === "static" || !question.questionType) && (
                                                    <div>
                                                        <Label htmlFor={`question-text-${i}`} className="text-xs">Soru Metni</Label>
                                                        <Textarea
                                                            id={`question-text-${i}`}
                                                            value={question.question || ""}
                                                            onChange={(e) =>
                                                            {
                                                                const newQuestions = [...selectedNode.data.questions];
                                                                newQuestions[i] = { ...newQuestions[i], question: e.target.value };
                                                                updateNodeData("questions", newQuestions);
                                                            }}
                                                            className="mt-1 text-sm"
                                                            rows={2}
                                                            placeholder="Sorunuzu yazın"
                                                        />
                                                    </div>
                                                )}

                                                {question.questionType === "dynamic" && (
                                                    <div>
                                                        <ScriptEditorModal
                                                            value={question.questionScript || ""}
                                                            onChange={(value) =>
                                                            {
                                                                const newQuestions = [...selectedNode.data.questions];
                                                                newQuestions[i] = { ...newQuestions[i], questionScript: value };
                                                                updateNodeData("questions", newQuestions);
                                                            }}
                                                            label={`Soru ${i + 1} Scripti`}
                                                            placeholder="return 'Sayın ' + vars.customer_name + ', hizmetimizi nasıl değerlendirirsiniz?';"
                                                            variables={chatVars}
                                                            functions={chatFunctions}
                                                            triggerLabel="Soru Script Düzenle"
                                                        />
                                                    </div>
                                                )}

                                                <div>
                                                    <Label htmlFor={`variable-name-${i}`} className="text-xs">Cevabın Kaydedileceği Değişken</Label>
                                                    <Select
                                                        value={question.variableName || ""}
                                                        onValueChange={(value) =>
                                                        {
                                                            const newQuestions = [...selectedNode.data.questions];
                                                            newQuestions[i] = { ...newQuestions[i], variableName: value };
                                                            updateNodeData("questions", newQuestions);
                                                        }}
                                                    >
                                                        <SelectTrigger id={`variable-name-${i}`} className="mt-1">
                                                            <SelectValue placeholder="Değişken seçin" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {chatVars.map((v) => (
                                                                <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Kullanıcının cevabı bu değişkene kaydedilecek
                                                    </p>
                                                </div>
                                            </div>
                                        ))}

                                        <div className="flex justify-center mt-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                {
                                                    const currentQuestions = selectedNode.data.questions || [];
                                                    const newQuestion = {
                                                        id: uniqueId(),
                                                        questionType: "static",
                                                        question: "Yeni soru",
                                                        questionScript: "",
                                                        variableName: `survey_q${currentQuestions.length + 1}`
                                                    };
                                                    updateNodeData("questions", [...currentQuestions, newQuestion]);
                                                }}
                                                className="w-full"
                                            >
                                                <PlusCircleIcon className="h-4 w-4 mr-2" />
                                                Yeni Soru Ekle
                                            </Button>
                                        </div>

                                        <p className="text-xs text-gray-500 mt-2">
                                            Her soru için kullanıcıdan cevap alınır ve belirtilen değişkene kaydedilir.
                                        </p>
                                    </div>
                                )}

                                {selectedNode.type === "script" && (
                                    <div className="space-y-3">
                                        <ScriptEditorModal
                                            value={selectedNode.data.script || ""}
                                            onChange={(value) => updateNodeData("script", value)}
                                            label="JavaScript Kodu"
                                            placeholder="// Değişkenleri manipule edin\nvars.customer_tier = 'gold';\nvars.last_update = new Date().toISOString();"
                                            variables={chatVars}
                                            functions={chatFunctions}
                                            triggerLabel="Script Düzenle"
                                        />
                                        <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded border border-gray-200">
                                            <p className="font-semibold">Not:</p>
                                            <p>• Bu script return ifadesi gerektirmez</p>
                                            <p>• <code className="bg-white px-1 rounded">vars</code> objesi üzerinden değişkenleri okuyup yazabilirsiniz</p>
                                            <p>• Örnek: <code className="bg-white px-1 rounded">vars.customer_name = 'Ahmet';</code></p>
                                            <p>• Tüm JavaScript fonksiyonlarını kullanabilirsiniz</p>
                                        </div>
                                    </div>
                                )}

                                {selectedNode.type === "api" && (
                                    <Tabs defaultValue="basic" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3">
                                            <TabsTrigger value="basic">Temel</TabsTrigger>
                                            <TabsTrigger value="headers">Headers</TabsTrigger>
                                            <TabsTrigger value="body">Body</TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="basic" className="space-y-3 mt-3">
                                            <div>
                                                <Label htmlFor="api-method">HTTP Metodu</Label>
                                                <Select
                                                    value={selectedNode.data.method || "GET"}
                                                    onValueChange={(value) => updateNodeData("method", value)}
                                                >
                                                    <SelectTrigger id="api-method" className="mt-1">
                                                        <SelectValue placeholder="Metod seçin" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="GET">GET</SelectItem>
                                                        <SelectItem value="POST">POST</SelectItem>
                                                        <SelectItem value="PUT">PUT</SelectItem>
                                                        <SelectItem value="DELETE">DELETE</SelectItem>
                                                        <SelectItem value="PATCH">PATCH</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label htmlFor="api-url-type">URL Tipi</Label>
                                                <Select
                                                    value={selectedNode.data.urlType || "static"}
                                                    onValueChange={(value) => updateNodeData("urlType", value)}
                                                >
                                                    <SelectTrigger id="api-url-type" className="mt-1">
                                                        <SelectValue placeholder="Tip seçin" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="static">Statik</SelectItem>
                                                        <SelectItem value="dynamic">Dinamik (Script)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            {(selectedNode.data.urlType === "static" || !selectedNode.data.urlType) && (
                                                <div>
                                                    <Label htmlFor="api-url">URL</Label>
                                                    <Input
                                                        id="api-url"
                                                        value={selectedNode.data.url || ""}
                                                        onChange={(e) => updateNodeData("url", e.target.value)}
                                                        className="mt-1"
                                                        placeholder="https://api.example.com/endpoint"
                                                    />
                                                </div>
                                            )}
                                            {selectedNode.data.urlType === "dynamic" && (
                                                <div>
                                                    <ScriptEditorModal
                                                        value={selectedNode.data.urlScript || ""}
                                                        onChange={(value) => updateNodeData("urlScript", value)}
                                                        label="URL Scripti"
                                                        placeholder='return `https://api.example.com/users/${vars.customer_id}`;'
                                                        variables={chatVars}
                                                        functions={chatFunctions}
                                                        triggerLabel="URL Script Düzenle"
                                                    />
                                                </div>
                                            )}
                                            {/* <textarea
                                                className="w-full whitespace-nowrap overflow-x-hidden p-2 border border-gray-300 rounded"
                                                placeholder="return `https://api.example.com/users/${vars.customer_id}`;"
                                                rows={3}
                                            /> */}
                                        </TabsContent>
                                        <TabsContent value="headers" className="space-y-3 mt-3">
                                            <div>
                                                <ScriptEditorModal
                                                    value={selectedNode.data.headersScript || ""}
                                                    onChange={(value) => updateNodeData("headersScript", value)}
                                                    label="Headers Scripti"
                                                    placeholder='return {\n  "Authorization": `Bearer ${vars.token}`,\n  "Content-Type": "application/json"\n};'
                                                    variables={chatVars}
                                                    functions={chatFunctions}
                                                    triggerLabel="Headers Script Düzenle"
                                                />
                                                <p className="text-xs text-gray-500 mt-2">
                                                    Script bir obje döndürmelidir. Her key-value çifti bir HTTP header oluşturur.
                                                </p>
                                            </div>
                                        </TabsContent>
                                        <TabsContent value="body" className="space-y-3 mt-3">
                                            <div>
                                                <Label htmlFor="body-type">Body Tipi</Label>
                                                <Select
                                                    value={selectedNode.data.bodyType || "json"}
                                                    onValueChange={(value) => updateNodeData("bodyType", value)}
                                                >
                                                    <SelectTrigger id="body-type" className="mt-1">
                                                        <SelectValue placeholder="Tip seçin" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="json">JSON</SelectItem>
                                                        <SelectItem value="multipart">Multipart Form Data</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <ScriptEditorModal
                                                    value={selectedNode.data.bodyScript || ""}
                                                    onChange={(value) => updateNodeData("bodyScript", value)}
                                                    label={selectedNode.data.bodyType === "multipart" ? "Form Data Scripti" : "Body Scripti"}
                                                    placeholder={selectedNode.data.bodyType === "multipart"
                                                        ? 'return {\n  "file": vars.uploaded_file,\n  "description": vars.file_description\n};'
                                                        : 'return {\n  "userId": vars.customer_id,\n  "timestamp": new Date().toISOString(),\n  "data": vars.form_data\n};'}
                                                    variables={chatVars}
                                                    functions={chatFunctions}
                                                    triggerLabel={selectedNode.data.bodyType === "multipart" ? "Form Data Script Düzenle" : "Body Script Düzenle"}
                                                />
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {selectedNode.data.bodyType === "multipart"
                                                        ? "Script bir obje döndürmelidir. Multipart form data olarak gönderilir."
                                                        : "Script bir obje döndürmelidir. POST/PUT istekleri için istek gövdesi olarak kullanılır."}
                                                </p>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                )}

                                {selectedNode.type === "api" && (
                                    <div className="space-y-3 mt-3">
                                        <Separator />
                                        <div>
                                            <Label htmlFor="response-variable">Cevabın Kaydedileceği Değişken</Label>
                                            <Select
                                                value={selectedNode.data.responseVariable || ""}
                                                onValueChange={(value) => updateNodeData("responseVariable", value)}
                                            >
                                                <SelectTrigger id="response-variable" className="mt-1">
                                                    <SelectValue placeholder="Değişken seçin" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {chatVars.map((v) => (
                                                        <SelectItem key={v.name} value={v.name}>{v.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-gray-500 mt-1">
                                                API cevabı bu değişkene JSON olarak kaydedilecek
                                            </p>
                                        </div>
                                    </div>
                                )}

                                <Separator />

                                <div>
                                    <Label>Pozisyon</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <div>
                                            <Label className="text-xs">X</Label>
                                            <Input
                                                type="number"
                                                value={Math.round(selectedNode.position.x)}
                                                readOnly
                                                className="text-sm"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Y</Label>
                                            <Input
                                                type="number"
                                                value={Math.round(selectedNode.position.y)}
                                                readOnly
                                                className="text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
        </div>
    );
}