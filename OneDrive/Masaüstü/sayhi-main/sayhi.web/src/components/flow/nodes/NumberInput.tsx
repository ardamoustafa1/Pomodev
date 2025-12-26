import { useCallback, useState, type ChangeEvent } from "react"
//import { Handle, Position, useNodeConnections, useNodesData, type HandleType } from "@xyflow/react"
import { Handle, Position } from "@xyflow/react"
import { Input } from "@/components/ui/input"

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

function NumberInput({ id, data }: {
    id: string;
    data: { label: string; };
})
{
    const [number, setNumber] = useState(0);

    const onChange = useCallback((e: ChangeEvent<HTMLInputElement>) =>
    {
        const cappedNumber = Math.round(Math.min(255, Math.max(0, parseInt(e.target.value))));
        setNumber(cappedNumber);
    }, []);

    return (
        <div className="number-input">
            <div>{data.label}</div>
            <Input
                id={`number-${id}`}
                name="number"
                type="number"
                min="0"
                max="255"
                onChange={onChange}
                className="nodrag"
                value={number} />
            <Handle type="source" position={Position.Right} />
        </div>
    );
}

export default NumberInput;