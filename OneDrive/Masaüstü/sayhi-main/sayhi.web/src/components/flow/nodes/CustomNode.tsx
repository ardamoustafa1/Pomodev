import { memo } from "react"
import { Position, Handle, useNodeConnections, type HandleType } from "@xyflow/react"

interface CustomHandleProps
{
    type: HandleType;
    position: Position;
    connectionCount: number;
    [key: string]: any;
}

const CustomHandle = (props: CustomHandleProps) =>
{
    const connections = useNodeConnections({
        handleType: props.type
    });

    return (
        <Handle {...props} isConnectable={connections.length < props.connectionCount} />
    );
};

export default memo(() =>
{
    return (
        <div>
            <CustomHandle
                type="target"
                position={Position.Left}
                connectionCount={1}
            />
            <div>{'← Only one edge allowed'}</div>
        </div>
    );
});