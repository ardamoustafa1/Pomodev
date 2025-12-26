import { memo } from "react"
import { Position, Handle } from "@xyflow/react"

const DefaulHandleStyle = {
    width: 20,
    height: 20,
    right: -5
};

export default memo(({ isConnectable }:
    {
        //data: any;
        isConnectable: boolean;
    }
) =>
{
    return (
        <>
            <div style={{ padding: 25 }}>
                <div>Node</div>
                <Handle
                    type="source"
                    id="red"
                    position={Position.Right}
                    style={{ ...DefaulHandleStyle, top: "15%", background: "red" }}
                    onConnect={(params) => console.log("handle onConnect", params)}
                    isConnectable={isConnectable}
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="blue"
                    style={{ ...DefaulHandleStyle, top: "50%", background: "blue" }}
                    isConnectable={isConnectable}
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="orange"
                    style={{ ...DefaulHandleStyle, top: "85%", background: "orange" }}
                    isConnectable={isConnectable}
                />
            </div>
        </>
    );
});