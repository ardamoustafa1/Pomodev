import { useState} from "react"
//import { Handle, Position, useNodeConnections, useNodesData, type HandleType } from "@xyflow/react"

/*
interface CustomHandleProps
{
    id: string;
    type: HandleType;
    label: string;
    onChange: (value: number | unknown) => void;
    //position: Position;
    //connectionCount: number;
    //[key: string]: any;
}

const CustomHandle = ({ id, type, label, onChange }: CustomHandleProps) =>
{
    const connections = useNodeConnections({
        handleType: type,
        handleId: id
    });

    const nodeData = useNodesData(connections?.[0].source);

    useEffect(() =>
    {
        onChange(nodeData?.data ? nodeData.data.value : 0);
    }, [nodeData]);

    //<Handle {...props} />
    return (
        <div>
            <Handle
                type="target"
                position={Position.Left}
                id={id}
                className="handle"
            />
            <label htmlFor="red" className="label">
                {label}
            </label>
        </div>
    );
};
*/

function ColorPreview()
{
    //const [color, setColor] = useState({ r: 0, g: 0, b: 0 });
    const [ color ] = useState({ r: 0, g: 0, b: 0 });

    return (
        <div
            className="node"
            style={{
                background: `rgb(${color.r}, ${color.g}, ${color.b})`,
            }}
        >
            {/*
            <CustomHandle
                id="red"
                label="R"
                onChange={(value) => setColor((c) => ({ ...c, r: value }))}
            />
            <CustomHandle
                id="green"
                label="G"
                onChange={(value) => setColor((c) => ({ ...c, g: value }))}
            />
            <CustomHandle
                id="blue"
                label="B"
                onChange={(value) => setColor((c) => ({ ...c, b: value }))}
            />
            */}
        </div>
    );
}

export default ColorPreview;