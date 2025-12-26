import { memo } from "react"
import { Button } from "@/components/ui/button"
import
{
    BaseNode,
    BaseNodeContent,
    BaseNodeFooter,
    BaseNodeHeader,
    BaseNodeHeaderTitle
} from "@/components/flow/nodes/base-node"
import { Rocket } from "lucide-react"
import { cn } from "../../../lib/utils"

export const BaseNodeFull = memo(({ data }: {
    data: { status: "loading" | "error" | "done" };
}) =>
{
    //className="w-96"
    return (
        <BaseNode
            className={cn("w-90 hover:ring-orange-500", {
                "border-orange-500": data.status === "loading",
                "border-red-500": data.status === "error"
            })}>
            <BaseNodeHeader className="border-b">
                <Rocket className="size-4" />
                <BaseNodeHeaderTitle>Header</BaseNodeHeaderTitle>
            </BaseNodeHeader>
            <BaseNodeContent>
                <h3 className="text-lg font-bold">Content</h3>
                <p className="text-xs">
                    This is a full-featured node with a header, content, and footer. You
                    can customize it as needed.
                </p>
            </BaseNodeContent>
            <BaseNodeFooter>
                <h4 className="text-md self-start font-bold">Footer</h4>

                <Button variant="outline" className="nodrag w-full">
                    Action 1
                </Button>
            </BaseNodeFooter>
        </BaseNode>
    );
});

BaseNodeFull.displayName = "BaseNodeFullDemo";