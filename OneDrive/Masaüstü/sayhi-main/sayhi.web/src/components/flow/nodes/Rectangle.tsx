import { NodeResizer, NodeToolbar, type Node, type NodeProps, type XYPosition, useReactFlow, useOnSelectionChange } from "@xyflow/react";
import { useCallback, useState, type PointerEvent } from "react";

export type RectangleNodeType = Node<{ color: string }, "rectangle">;

const colorOptions = [
    "#f5efe9", // very light warm grey
    "#ef4444", // red
    "#f97316", // orange
    "#eab308", // yellow
    "#22c55e", // green
    "#3b82f6", // blue
    "#8b5cf6", // purple
    "#ec4899", // pink
    "#64748b"  // gray
];

const colors = [
    "#D14D41",
    "#DA702C",
    "#D0A215",
    "#879A39",
    "#3AA99F",
    "#4385BE",
    "#8B7EC8",
    "#CE5D97"
];

const styles = {
    toolbar: {
        display: "flex",
        gap: "0.25rem",
        borderRadius: "0.5rem",
        border: "1px solid #e5e5e5",
        backgroundColor: "white",
        padding: "0.5rem",
        boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)"
    },
    colorButton: {
        height: "1.5rem",
        width: "1.5rem",
        borderRadius: "9999px",
        border: "none",
        cursor: "pointer",
        transition: "transform 0.15s ease-in-out"
    },
    colorButtonHover: {
        transform: "scale(1.1)"
    },
    outerContainer: {
        display: "flex",
        height: "100%",
        width: "100%",
        alignItems: "center",
        justifyContent: "center"
    },
    innerContainer: {
        position: "relative" as const,
        height: "calc(100% - 5px)",
        width: "calc(100% - 5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "white",
        borderRadius: "0.375rem",
        boxShadow: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        border: "1px solid #e5e5e5"
    },
    innerContainerSelected: {
        outline: "2px solid #3b82f6",
        outlineOffset: "2px"
    }
} as const;

function getPosition(start: XYPosition, end: XYPosition)
{
    return {
        x: Math.min(start.x, end.x),
        y: Math.min(start.y, end.y),
    };
}

function getDimensions(start: XYPosition, end: XYPosition, zoom: number = 1)
{
    return {
        width: Math.abs(end.x - start.x) / zoom,
        height: Math.abs(end.y - start.y) / zoom,
    };
}

function getRandomColor(): string
{
    return colors[Math.floor(Math.random() * colors.length)];
}

export function RectangleTool()
{
    const [start, setStart] = useState<XYPosition | null>(null);
    const [end, setEnd] = useState<XYPosition | null>(null);

    const { screenToFlowPosition, getViewport, setNodes } = useReactFlow();

    function handlePointerDown(e: PointerEvent)
    {
        (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
        setStart({ x: e.pageX, y: e.pageY });
    }

    function handlePointerMove(e: PointerEvent)
    {
        if (e.buttons !== 1) return;
        setEnd({ x: e.pageX, y: e.pageY });
    }

    function handlePointerUp()
    {
        if (!start || !end) return;
        const position = screenToFlowPosition(getPosition(start, end));
        const dimension = getDimensions(start, end, getViewport().zoom);

        setNodes((nodes) => [
            ...nodes,
            {
                id: crypto.randomUUID(),
                type: "rectangle",
                position,
                ...dimension,
                data: {
                    color: getRandomColor(),
                },
            },
        ]);

        setStart(null);
        setEnd(null);
    }

    const rect =
        start && end
            ? {
                position: getPosition(start, end),
                dimension: getDimensions(start, end),
            }
            : null;

    return (
        <div
            className="nopan nodrag tool-overlay"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}>
            {rect && (
                <div
                    className="rectangle-preview"
                    style={{
                        ...rect.dimension,
                        transform: `translate(${rect.position.x}px, ${rect.position.y}px)`,
                        border: "2px dashed rgba(0, 89, 220, 0.8)",
                        pointerEvents: "none",
                    }}
                ></div>
            )}
        </div>
    );
}

export function RectangleNode({
    id,
    selected,
    dragging,
    data: { color }
}: NodeProps<RectangleNodeType>)
{
    const { updateNodeData } = useReactFlow();

    const [multipleNodesSelected, setMultipleNodesSelected] = useState(false);

    const onSelectionChange = useCallback(
        ({ nodes }: { nodes: Node[] }) =>
        {
            if (nodes.length > 1)
            {
                setMultipleNodesSelected(true);
            } else
            {
                setMultipleNodesSelected(false);
            }
        },
        [setMultipleNodesSelected],
    );

    useOnSelectionChange({ onChange: onSelectionChange });

    const handleColorChange = (newColor: string) =>
    {
        updateNodeData(id, { color: newColor });
    };

    return (
        <>
            <NodeResizer isVisible={selected && !dragging} />
            <NodeToolbar
                isVisible={selected && !dragging && !multipleNodesSelected}
                className="nopan">
                <div style={styles.toolbar}>
                    {colorOptions.map((colorOption) => (
                        <button
                            key={colorOption}
                            onClick={() => handleColorChange(colorOption)}
                            style={{
                                ...styles.colorButton,
                                backgroundColor: colorOption,
                            }}
                            title={`Set color to ${colorOption}`}
                        />
                    ))}
                </div>
            </NodeToolbar>
            <div style={styles.outerContainer}>
                <div
                    style={{
                        ...styles.innerContainer,
                        backgroundColor: color,
                        ...(selected ? styles.innerContainerSelected : {}),
                    }}
                ></div>
            </div>
        </>
    );
}