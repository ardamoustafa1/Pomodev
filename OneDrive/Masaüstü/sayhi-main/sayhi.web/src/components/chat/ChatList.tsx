import { useMemo, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { InboxIcon, SearchIcon, SquarePenIcon, MessagesSquareIcon } from "lucide-react"
import storage from "../../lib/storage"
import { SourceType, AlertType, type Chat } from "../../lib/Models";
import { useChats } from "../../lib/chatContext"
import { httpClients } from "../../lib/apiClient"
import ChatItem from "./ChatItem"

const Search = ({ onSearch }: { onSearch: (q: string) => void }) =>
{
    return (
        <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
                placeholder="Ara..."
                onChange={(e) => onSearch(e.target.value)}
                className="pl-9" />
        </div>);
};

export default function ChatList()
{
    const [searchQuery, setSearchQuery] = useState("");
    const { chats, chatStore } = useChats();

    const user = storage.User.get();

    useEffect(() =>
    {
        (async () =>
        {
            let chatList: Chat[] = await httpClients.Chat.getChats();

            if (!chatList)
                return;

            chatStore.setChats(chatList);
        })();
    }, []);

    const filteredChats = useMemo(
        () => chats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
        [chats, searchQuery]);

    function createNewChat()
    {
        if (!user)
            return false;

        chatStore.addChat({
            id: "",
            name: "",
            participants: [
                {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    avatar: user.avatar,
                    isOnline: true
                }
            ],
            typings: new Map(),
            typingIndicator: undefined,
            createdAt: new Date(),
            lastMessage: "",
            source: SourceType.Chat,
            tags: new Map<string, AlertType>(),
            unreadCount: 0
        });
    }

    async function inviteChat()
    {
        //await chatStore.invite("chatId", "recipientId");
        chatStore.showRinging({
            id: "",
            caller: {
                id: "",
                name: "",
                connectionId: "",
                type: 0,
                avatar: "",
	            email: ""
            },
            name: "Sarıçizmeli Mehmet Ağa",
            phone: "+90 555 555 11 22",
            message: "Merhaba! Sana bir şey sormak istiyorum, müsait misin?"
        });
    }

    async function joinChat()
    {
        //await chatStore.join("chatId");
        chatStore.showRinging({
            id: "",
            caller: {
                id: "",
                name: "",
                connectionId: "",
                type: 0,
                avatar: "",
	            email: ""
            },
            name: "Mehmet Sarıçizmeli",
            phone: "+90 555 555 11 22",
            message: "Merhaba! Sana bir şey sormak istiyorum, müsait misin?"
        });
    }

    async function leaveChat()
    {
        await chatStore.leave("chatId");
    }

    const Title = () => (
        <div className="flex items-center justify-between py-2">
            <div className="flex gap-2">
                <h2 className="text-xl font-bold">Inbox</h2>
                {/*<MessagesSquareIcon className="size-5" />*/}
                <InboxIcon className="size-5" />
            </div>
            {import.meta.env.DEV && (<>
                <Button variant="outline" size="icon" onClick={inviteChat}>
                    <MessagesSquareIcon className="size-4" />invite
                </Button>
                <Button variant="outline" size="icon" onClick={joinChat}>
                    <MessagesSquareIcon className="size-4" />join
                </Button>
                <Button variant="outline" size="icon" onClick={leaveChat}>
                    <MessagesSquareIcon className="size-4" />leave
                </Button>
            </>)}
            <Button variant="outline" size="icon" onClick={createNewChat}>
                <SquarePenIcon className="size-4" />
            </Button>
        </div>
    );

    const ChatItems = () =>
    {
        return filteredChats.length === 0
            ? (
                <div style={{ padding: "40px", textAlign: "center", color: "#999", fontSize: "14px" }}>
                    No active chats. Join a chat to get started.
                </div>
            )
            : (
                <ScrollArea className="flex-1 overflow-y-auto">
                    {filteredChats.map(c => (
                        <ChatItem key={c.id} chatId={c.id} />
                    ))}
                </ScrollArea>
            );
    };

    return (
        <div className="flex-1 flex flex-col">
            <div className="p-4">
                <Title />
                <Search onSearch={setSearchQuery} />
            </div>
            <ChatItems />
        </div>
    );
}