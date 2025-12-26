import { useState, useEffect, useRef } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"
import { SearchIcon, MoreVerticalIcon, PhoneIcon, VideoIcon, MessagesSquareIcon } from "lucide-react"
import { getChatTitle, isGroupChat, shouldShowAvatar } from "../../lib/utils"
import { timePassed, formatTime } from "../../lib/dateTimeUtils"
import { type ChatMessage } from "../../lib/Models"
import { useChatStore, useChatState } from "../../lib/chatContext"
import { httpClients } from "../../lib/apiClient"
import { SuggestionTitle, SuggestionArea, SuggestionColumn } from "./Suggestions"
import ChatAvatar from "./ChatAvatar"
import MessageInput from "./MessageInput"

export default function MessageList()
{
    //const chat = useSelectedChat();
    const chatStore = useChatStore();
    const { chat, messages } = useChatState();
    //const { chat } = useChatState();
    //const signalR = useSignalRContext();
    //const [messages, setMessages] = useState<ChatMessage[]>([]);
    //const [suggestions, setSuggestions] = useState<Record<string, Suggestion[]>>({});
    const [showSuggestions, setShowSuggestions] = useState(true);

    //let user = storage.User.get();

    useEffect(() =>
    {
        (async () =>
        {
            if (!chat)
                return;

            const chatMessageInitial: ChatMessage[] = await httpClients.Chat.getMessages(chat.id);

            if (!chatMessageInitial)
                return;

            const _messages = chatMessageInitial.reverse();
            chatStore.messages = _messages;

            //////////////////
            //setMessages(_messages);
            //////////////////
        })();
    }, [chat]);

    function test02()
    {
        if (!chat)
            return false;

        chatStore.sendTyping(chat.id, true);
    }

    const ChatTitle = () => (
        <div className="flex items-center space-x-3 justify-start">
            <ChatAvatar chat={chat} />

            {chat && (
                <div className="text-left justify-start">
                    <h3 className="font-semibold text-gray-900">{getChatTitle(chat)}</h3>
                    <p className="text-sm text-gray-500">
                        {chat
                            ? (isGroupChat(chat)
                                ? chat.participants.map(p => p.name).join(", ")
                                : (chat.participants[0].isOnline
                                    ? "Çevrimiçi"
                                    : (messages.length > 0 ? `Son görülme ${timePassed(messages[0].createdAt)}` : "Çevrimdışı")))
                            : ""}
                    </p>
                </div>
            )}
        </div>);

    const ChatToolBar = () => (
        <div className="flex items-center space-x-2">
            <Button variant="ghost" size="icon">
                <PhoneIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
                <VideoIcon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
                <SearchIcon className="h-5 w-5" />
            </Button>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <MoreVerticalIcon className="h-5 w-5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>Profili Görüntüle</DropdownMenuItem>
                    <DropdownMenuItem>Medya, Linkler</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">Sohbeti Sessize Al</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );

    const UserAvatar = ({ message, messageIndex }: { message: ChatMessage; messageIndex: number; }) =>
    {
        if (!chat)
            return false;

        if (!shouldShowAvatar(chat, messages, messageIndex))
            return;

        const participant = chat.participants.find(p => p.id === message.senderId);

        return (
            <Avatar style={{ width: 32, height: 32, borderRadius: "50%", marginLeft: -32 }}>
                <AvatarImage src={participant?.avatar} alt={participant?.name} />
                <AvatarFallback>{participant?.name}</AvatarFallback>
            </Avatar>
        );
    };

    const MessagesArea = () =>
    {
        const messagesEndRef = useRef<HTMLDivElement>(null);
        useEffect(() =>
        {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, [messages]);

        return (
            <div className={`flex-1 overflow-y-auto ${showSuggestions ? "chatAreaWithSuggestions" : ""}`}>
                <div className="flex flex-col-reverse overflow-y-auto pt-4 pb-0 pl-12 pr-4 w-full min-h-full">
                    <div ref={messagesEndRef} />
                    {messages.map((message, messageIndex) => (
                        <div key={message.id} className="flex w-full group mb-2">
                            <MessageColumn message={message} messageIndex={messageIndex} />
                            <SuggestionColumn messageId={message.id} suggestions={chatStore.suggestions} showSuggestions={showSuggestions} />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const MessageColumn = ({ message, messageIndex }: { message: ChatMessage; messageIndex: number; }) =>
    (
        <div className="flex-1 flex flex-col pr-4 relative">
            <div className={`flex w-full ${message.isOwn ? "justify-end" : "justify-start"}`}>
                <UserAvatar message={message} messageIndex={messageIndex} />
                <div className={`px-4 py-2 max-w-[75%] break-words shadow-lg message relative group/msg ${message.isOwn
                    ? "own rounded-[16px_16px_0_16px] shadow-gray-400"
                    : "other rounded-[16px_16px_16px_0]"}`}>
                    <p>{message.text}</p>
                    <div className="flex items-center justify-end mt-1 space-x-1">
                        <span className="text-xs time">{formatTime(message.createdAt)}</span>
                        {message.isOwn && (
                            <span className="text-xs status">
                                {message.status === "Sent" && "✓"}
                                {message.status === "Delivered" && "✓✓"}
                                {message.status === "Read" && "✓✓"}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    const WhenEmpty = () => (
        <div className="flex-1 flex flex-col place-content-center">
            <Card className="w-full border-none shadow-none">
                <CardHeader>
                    <CardTitle className="flex flex-col items-center space-y-6">
                        <div className="flex size-16 items-center justify-center rounded-full border-2 mb-8">
                            <MessagesSquareIcon className="size-8" />
                        </div>
                        Your messages
                    </CardTitle>
                    <CardDescription>Send a message to start a chat.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="default" onClick={test02}>
                        Send message
                    </Button>
                </CardContent>
            </Card>
        </div>
    );

    /*
    const addSuggestion = (message: ChatMessage) =>
    {
        const newSuggestion: Suggestion = {
            id: `suggestion-${message.id}-${Date.now()}`,
            title: `Asistanın Önerisi`,
            text: `"${message.text.substring(0, 15)}${message.text.length > 15 ? "..." : ""}" hakkında bir öneri.`
            //createdAt: new Date(),
            //author: "Ben"
        };

        setSuggestions(prev => ({
            ...prev,
            [message.id]: [...(prev[message.id] || []), newSuggestion]
        }));
    };
    */

    return (
        <div className="flex-1 flex flex-col h-full">
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex-1"><ChatTitle /></div>
                {messages.length > 0 &&
                    <>
                        <ChatToolBar />
                        <SuggestionTitle showSuggestions={showSuggestions}
                            setShowSuggestions={(e) =>
                            {
                                /*
                                const message = GetMessageWithoutSuggestion(messages, chatStore.suggestions);
                                if (message)
                                {
                                    //addSuggestion(message);
                                    chatStore.setSuggestions(message.id,
                                        [
                                            "İşte bu mesaj için bir öneri.",
                                            "Başka bir öneri daha.",
                                            "Daha fazla öneri."
                                        ]);
                                }
                                */

                                setShowSuggestions(e);
                            }} />
                    </>}
            </div>

            {messages.length > 0
                ? (
                    <div className="flex-1 flex flex-col chatArea max-h-full">
                        <MessagesArea />
                        <div className="shrink-0 w-full flex">
                            <div className="flex-1">
                                <MessageInput
                                    sendMessage={(messageInput) => chatStore.sendMessage(chat?.id, messageInput)}
                                    sendTyping={() => chatStore.sendTyping(chat?.id, true)} />
                            </div>
                            <SuggestionArea showSuggestions={showSuggestions} />
                        </div>
                    </div>
                )
                : (
                    <WhenEmpty />
                )}
        </div>
    );
}