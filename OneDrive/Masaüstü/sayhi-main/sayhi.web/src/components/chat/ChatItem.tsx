import { Badge } from "@/components/ui/badge"
import { getChatTitle } from "../../lib/utils"
import { timePassed } from "../../lib/dateTimeUtils"
import { type Chat } from "../../lib/Models"
import { useChat } from "../../lib/chatContext"
import ChatAvatar from "./ChatAvatar"

const tagTypeUi: {
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
}[] = [
        { variant: "outline", className: "" },
        { variant: "secondary", className: "bg-blue-500 text-white" },
        { variant: "secondary", className: "bg-yellow-500 text-black" },
        { variant: "destructive", className: "" }
    ];

//memo(
const ChatItem = ({ chatId }: { chatId: string }) =>
{
    const { chat, chatStore } = useChat(chatId);

    console.log("Rendering ChatItem for chatId:", chatId, "chat:", chat);
    /*
    {
        id: "019afaf1-17c6-7f2f-871a-ade21dcfab79"
        createdAt: "2025-12-07T21:11:35.622768+00:00"
        lastMessage: "Asl pls!"
        name: ""
        participantMap: Map(2) {'019afaf1-17c3-7e97-b740-df009eb4435f' => {…}, '019afaf1-17c3-71e2-b6bd-e6ac47f0376f' => {…}}
        participants: (2) [{…}, {…}]
        source: 6
        tags: {Order: 0}
        typings: Map(0) {size: 0}
        unreadCount: 2
    }

    {
        id: ""
        createdAt: Mon Dec 08 2025 00:35:42 GMT+0200 (Eastern European Standard Time) {}
        lastMessage: ""
        name: ""
        participants: [
            {
                avatar: ""
                connectionId: "VSWNVHSKCJT5gGpZHOBI4A"
                email: ""
                id: "019afaf2-d2ef-7ac9-8722-dc0ae63bda89"
                isOnline: false
                name: "user_db3kvrj7c5i9049"
                type: 1
            }
        ]
        source: 1
        tags: Map(0) {size: 0}
        typingIndicator: undefined
        typings: Map(0) {size: 0}
        unreadCount: 0
    }
    */

    if (!chat)
        return null;

    //const user = storage.User.get();

    const onClick = () =>
    {
        console.log("Click chatId:", chatId, "chat:", chat); // Debug log to trace

        //markAsRead(chatId);
        chatStore.selectedChatId = chatId;
        //setSelectedChat(chatId);
    };

    const ChatTitle = ({ chat }: { chat: Chat }) => (
        <h3 className="font-semibold text-sm text-gray-900 truncate">
            {getChatTitle(chat)}
        </h3>
    );

    const LastMessageTime = ({ chat }: { chat: Chat }) => (
        <span className="text-xs text-gray-500">{timePassed(chat.createdAt)}</span>
    );

    const Tags = ({ chat }: { chat: Chat }) => (
        <p className="text-sm truncate">
            {Object
                .entries(chat.tags)
                .map(([value, _type]) =>
                {
                    const type = tagTypeUi[_type];
                    return (
                        <Badge key={value} variant={type.variant} className={type.className}>{value}</Badge>
                    );
                })}
        </p>
    );

    const NewMessagesCount = ({ chat }: { chat: Chat }) =>
        chat.unreadCount > 0 && (
            <Badge className="ml-2 unread">{chat.unreadCount}</Badge>
        );

    return (
        <div onClick={onClick}
            className={`cursor-pointer hover:bg-gray-50 transition chat ${chatId === chatStore.selectedChatId ? "selected" : "not-selected"}`}>
            <div className="flex items-start space-x-3">
                <ChatAvatar chat={chat} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <ChatTitle chat={chat} />
                        <LastMessageTime chat={chat} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            {chat.typingIndicator
                                ? <span className="typing">{chat.typingIndicator}</span>
                                : <Tags chat={chat} />}
                        </div>
                        <NewMessagesCount chat={chat} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatItem;