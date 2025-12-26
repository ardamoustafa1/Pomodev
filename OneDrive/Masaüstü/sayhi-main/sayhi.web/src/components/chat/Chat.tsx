import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"
import ChatList from "./ChatList"
import MessageList from "./MessageList"

export default function Chat()
{
    return (
        <ResizablePanelGroup direction="horizontal" className="w-full h-full">
            <ResizablePanel defaultSize={25} className="flex min-w-[80px]">
                <ChatList />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75} className="flex min-w-[100px]">
                <MessageList />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}