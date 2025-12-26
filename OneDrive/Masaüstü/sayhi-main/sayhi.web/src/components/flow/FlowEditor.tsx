import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import
{
    ReactFlow, ReactFlowProvider, MiniMap, Controls, Background, Position, Panel,
    useNodesState, useEdgesState, addEdge, //useReactFlow,
    type Connection, type NodeTypes, type Node//, type ReactFlowInstance
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import NumberInput from "./nodes/NumberInput"
import NodeCard from "./nodes/NodeCard"
import CustomNode from "./nodes/CustomNode"
import UcluNode from "./nodes/UcluNode"
import { BaseNodeFull } from "./nodes/BaseNodeFull"
import { ActionBarNode } from "./nodes/ActionBarNode"
import { RectangleTool, RectangleNode } from "./nodes/Rectangle"
import "./FlowEditor.css"

const nodeTypes: NodeTypes = {
    custom: CustomNode,
    number: NumberInput,
    card: NodeCard,
    rectangle: RectangleNode,
    uclu: UcluNode,
    base: BaseNodeFull,
    actionBar: ActionBarNode
};

const defaultNode = {
    sourcePosition: Position.Right,
    targetPosition: Position.Left
};

function FlowEditor()
{
    const [nodes, setNodes, onNodesChange] = useNodesState<Node>([
        { id: "1", position: { x: 0, y: 0 }, data: { label: "Node 1" }, ...defaultNode },
        { id: "2", position: { x: 0, y: 100 }, data: { label: "Node 2" }, type: "input", ...defaultNode },
        { id: "3", position: { x: 150, y: 100 }, data: { label: "Node 3" }, type: "input", ...defaultNode },
        { id: "4", position: { x: 0, y: 200 }, data: { label: "Node 4", connectionCount: 1 }, type: "custom", ...defaultNode },
        { id: "5", position: { x: 0, y: 300 }, data: { label: "Node 5" }, type: "number", ...defaultNode },
        { id: "6", position: { x: 0, y: 400 }, data: { label: "Node 6" }, type: "card", ...defaultNode },
        { id: "7", position: { x: 250, y: 5 }, width: 150, height: 100, data: { color: "#ff7000" }, type: "rectangle", ...defaultNode },
        { id: "8", position: { x: 0, y: 500 }, data: { label: "Node 7" }, type: "uclu", ...defaultNode },
        { id: "9", position: { x: 0, y: 600 }, data: { label: "Node 8" }, type: "base", ...defaultNode },
        { id: "10", position: { x: 200, y: 600 }, data: { label: "Node 9" }, type: "actionBar", ...defaultNode },
        //{ id: "10", type: "default", position: { x: 0, y: 0 }, data: { label: <NodeCard label="Start" /> } },
    ]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([
        { id: "e1-2", source: "1", target: "2" }
    ]);
    //const { setViewport } = useReactFlow();
    //const [rfInstance, setRfInstance] = useState<ReactFlowInstance<Node, { id: string; source: string; target: string; }> | null>(null);

    /*
    const onNodesChange = useCallback(
        (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
        [],
    );
    const onEdgesChange = useCallback(
        (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
        [],
    );
    */

    const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

    const [isRectangleActive, setIsRectangleActive] = useState(true);

    // Load
    /*
    useEffect(() =>
    {
        (async () =>
        {
            //const flow = JSON.parse(localStorage.getItem(flowKey));
            const flow = JSON.parse("{ \"viewport\": {} }");

            if (flow)
            {
                const { x = 0, y = 0, zoom = 1 } = flow.viewport;
                setNodes(flow.nodes || []);
                setEdges(flow.edges || []);
                setViewport({ x, y, zoom });
            }
        })();
    }, [setNodes, setViewport]);
    */

    // Save
    /*
    useEffect(() =>
    {
        if (rfInstance)
        {
            const flow = rfInstance.toObject();
            //localStorage.setItem(flowKey, JSON.stringify(flow));
            console.log(flow);
        }
    }, [rfInstance]);
    */

    const getNodeId = () => `randomnode_${+new Date()}`;
    const createNode = (label: string, type: string): Node => ({
        id: getNodeId(),
        data: { label: label },
        position: {
            x: (Math.random() - 0.5) * 400,
            y: (Math.random() - 0.5) * 400
        },
        type: type
    });

    const onAdd1 = useCallback(() =>
    {
        const newNode = createNode("Added node", "input");
        setNodes((nds) => nds.concat(newNode));
    }, [setNodes]);

    const onAdd2 = useCallback(() =>
    {
        const newNode = createNode("Added node", "number");
        setNodes((nds) => nds.concat(newNode));
    }, [setNodes]);

    const onAdd3 = useCallback(() =>
    {
        const newNode = createNode("Added node", "custom");
        newNode.data.connectionCount = 1;
        setNodes((nds) => nds.concat(newNode));
    }, [setNodes]);

    // onInit={setRfInstance}
    return (
        <ReactFlowProvider>
            <ReactFlow
                className="touch-flow"
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                defaultEdgeOptions={{ animated: true }}>
                <MiniMap />
                <Controls />
                <Background />
                <RectangleTool />
                <Panel position="top-left">
                    <div className="xy-theme__button-group">
                        <button
                            className={`xy-theme__button ${isRectangleActive ? "active" : ""}`}
                            onClick={() => setIsRectangleActive(true)}>
                            Rectangle Mode
                        </button>
                        <button
                            className={`xy-theme__button ${!isRectangleActive ? "active" : ""}`}
                            onClick={() => setIsRectangleActive(false)}>
                            Selection Mode
                        </button>
                    </div>
                </Panel>
                <Panel position="top-right">
                    <button className="xy-theme__button" onClick={onAdd1}>add input</button>
                    <button className="xy-theme__button" onClick={onAdd2}>add number</button>
                    <Button className="xy-theme__button" onClick={onAdd3}>add custom</Button>
                </Panel>
            </ReactFlow>
        </ReactFlowProvider>
    );
}

export default () => (
    <ReactFlowProvider>
        <FlowEditor />
    </ReactFlowProvider>
);