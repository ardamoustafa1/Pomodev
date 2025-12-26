import React, { useState, useEffect, useEffectEvent, useRef, useCallback, memo } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"
import { SendIcon, SearchIcon, MoreVerticalIcon, PhoneIcon, VideoIcon, PaperclipIcon, SmileIcon, MessagesSquareIcon } from "lucide-react"
import { getChatTitle, isGroupChat, shouldShowAvatar } from "../../lib/utils"
import { timePassed, formatTime } from "../../lib/dateTimeUtils"
import storage from "../../lib/storage";
import { type ChatMessage, type Chat, type Peer } from "../../lib/Models"
import { type MessageRequest } from "../../lib/signalRHook"
import { useSignalRContext } from "../../lib/signalRContext"
import { httpClients } from "../../lib/apiClient"
import ChatAvatar from "./ChatAvatar"

const MessageList = ({ chat }: {
    chat: Chat | undefined
}) =>
{
    //const { isConnected, peers, error, sendMessage } = useSignalRContext();
    const signalR = useSignalRContext();

    const chatRef = useRef<Chat | undefined>(null);

    //const [messageInput, setMessageInput] = useState("");
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    let user = storage.User.get();

    useEffect(() =>
    {
        (async () =>
        {
            if (!chat)
                return;

            const chatMessageInitial: ChatMessage[] = await httpClients.Chat.getMessages(chat.id);

            if (!chatMessageInitial)
                return;

            setMessages(chatMessageInitial.reverse());
        })();

        chatRef.current = chat;

        /*
        console.log("timePassed", timePassed("2025-11-01T18:41:48.1470809"));
        console.log("timePassed", timePassed("2025-11-01T17:41:48.1470809"));
        console.log("timePassed", timePassed("2025-11-01T16:41:48.1470809"));
        console.log("timePassed", timePassed("2025-10-31T15:41:48.1470809"));
        console.log("timePassed", timePassed("2025-10-30T14:41:48.1470809"));
        console.log("timePassed", timePassed("2025-10-29T13:41:48.1470809"));
        console.log("timePassed", timePassed("2025-10-28T13:41:48.1470809"));
        console.log("timePassed", timePassed("2025-10-27T13:41:48.1470809"));
        console.log("timePassed", timePassed("2025-10-26T13:41:48.1470809"));
        console.log("timePassed", timePassed("2025-10-25T13:41:48.1470809"));
        console.log("timePassed", timePassed("2025-10-24T13:41:48.1470809"));
        console.log("timePassed", timePassed("2025-10-23T13:41:48.1470809"));
        */

    }, [chat]);

    const onReceiveMessage = useEffectEvent((message: MessageRequest) =>
    {
        if (!user || !chat)
            return;

        if (chat.id !== message.chatId)
            return;

        /*
        {
            "chatId":"019a50d0-ba62-7bf9-841c-4479881d8b6e",
            "id":"019a5103-8237-726f-887a-f10b7e26d3d5"
            "text":"ada",
            "createdAt":"2025-11-04T22:36:15.793+00:00",
            "fromId":"019a50d0-ba61-7c0e-ae7c-5c5dfaba2494",
            "toId":null,
        }
        */

        const newMessage: ChatMessage = {
            id: message.id ?? "",
            text: message.text,
            createdAt: message.createdAt,
            senderId: message.senderId,
            isOwn: message.senderId === user.id,
            status: "Delivered"
        };

        setMessages(oldMessages => [newMessage, ...oldMessages]);
    });

    const onUserLoggedIn = useEffectEvent((peer: Peer) =>
    {
        console.log("UserLoggedIn", peer);
    });
    const onUserLoggedOut = useEffectEvent((peer: Peer) =>
    {
        console.log("UserLoggedIn", peer);
    });
    const onTyping = useEffectEvent((chatId: string, senderId: string, isTyping: boolean) =>
        console.log("Typing", chatId, senderId, isTyping));
    const onActiveUsers = useEffectEvent((peers: Peer[]) =>
        console.log("ActiveUsers", peers));
    const onActiveAgents = useEffectEvent((peers: Peer[]) =>
        console.log("ActiveAgents", peers));
    const onReceiveInvite = useEffectEvent((chatId: string, inviter?: Peer) =>
        console.log("ReceiveInvite", chatId, inviter));
    const onUserJoined = useEffectEvent((chatId: string, peer: Peer) =>
        console.log("UserJoined", chatId, peer));
    const onUserLeft = useEffectEvent((chatId: string, peer: Peer) =>
        console.log("UserLeft", chatId, peer));

    useEffect(() =>
    {
        signalR.on("ReceiveMessage", onReceiveMessage);
        signalR.on("UserLoggedIn", onUserLoggedIn);
        signalR.on("UserLoggedOut", onUserLoggedOut);
        signalR.on("Typing", onTyping);
        signalR.on("ActiveUsers", onActiveUsers);
        signalR.on("ActiveAgents", onActiveAgents);
        signalR.on("ReceiveInvite", onReceiveInvite);
        signalR.on("UserJoined", onUserJoined);
        signalR.on("UserLeft", onUserLeft);

        return () =>
        {
            signalR.off("ReceiveMessage", onReceiveMessage);
            signalR.off("UserLoggedIn", onUserLoggedIn);
            signalR.off("UserLoggedOut", onUserLoggedOut);
            signalR.off("Typing", onTyping);
            signalR.off("ActiveUsers", onActiveUsers);
            signalR.off("ActiveAgents", onActiveAgents);
            signalR.off("ReceiveInvite", onReceiveInvite);
            signalR.off("UserJoined", onUserJoined);
            signalR.off("UserLeft", onUserLeft);
        };
    }, [signalR.on]);

    /*
    const sendMessage = (chatId: string, senderId: string, text: string) =>
    {
        //const messageRequest: MessageRequest = {
        //    //id: Date.now().toString(),
        //    chatId: chatId,
        //    senderId: senderId,
        //    //toId,
        //    text,
        //    createdAt: new Date()
        //};
        //signalR.sendMessage(messageRequest);
        signalR.sendMessage(chatId, senderId, text);
    };
    */

    /*
    const handleSendMessage = (newMessages: ChatMessage[]) =>
    {
        if (user && chat)
        {
            setMessages([...newMessages, ...messages]);
        }
    };
    */
    function test02()
    {
        console.log("bbb...");

        if (!chat || !user)
            return false;

        signalR.sendTyping(chat.id, true);
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
                    <DropdownMenuItem>Sohbeti Sessize Al</DropdownMenuItem>
                    <DropdownMenuItem>Medya, Linkler</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">Sohbeti Sil</DropdownMenuItem>
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

        //const participant = chat.participants.find(p => p.id === messages[messageIndex].senderId);
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
            <div className="flex-1 flex flex-col-reverse overflow-y-auto pt-4 pb-0 px-6 max-w-[80%] w-full place-self-center">
                <div ref={messagesEndRef} />
                {messages.map((message, messageIndex) => (
                    <div key={message.id} className={`flex p-2 ${message.isOwn ? "justify-end" : "justify-start"}`}>

                        <UserAvatar message={message} messageIndex={messageIndex} />

                        <div className={`px-4 py-2 max-w-[75%] break-words shadow-lg message ${message.isOwn
                            ? "own rounded-[16px_16px_0_16px] shadow-gray-400"
                            : "other rounded-[16px_16px_16px_0]"}`}>
                            {/* className="text-sm" */}
                            <p>{message.text}</p>
                            <div className="flex items-center justify-end mt-1 space-x-1">
                                <span className="text-xs time">
                                    {formatTime(message.createdAt)}
                                </span>
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
                ))}
            </div>
        );
    };

    //const MessageInput = memo(({ onSendMessage }: { onSendMessage: (newMessages: ChatMessage[]) => void; }) =>
    const MessageInput = memo(() =>
    {
        const [messageInput, setMessageInput] = useState("");

        const send = useCallback(() =>
        {
            if (user && chat && messageInput.trim())
            {
                /*
                const newMessages: ChatMessage[] =
                    (isGroupChat(chat)
                        ? chat.participants.map(p => p.id)
                        : [chat.participants[0].id])
                        .map(participantId => sendMessage(chat.id, user.id, participantId, messageInput));
                onSendMessage(newMessages);
                */
                signalR.sendMessage(
                    chat.id, messageInput);
                //{
                //    chatId: chat.id,
                //    senderId: user.id,
                //    text: messageInput,
                //    createdAt: new Date()
                //});

                setMessageInput("");
            }
            //}, [messageInput, onSendMessage]);
        }, [messageInput]);

        //const timeoutRef = useRef<number | null>(null);
        const lastSentRef = useRef<number>(0);
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
        {
            //if (timeoutRef.current)
            //{
            //    clearTimeout(timeoutRef.current);
            //}
            //timeoutRef.current = setTimeout(() =>
            //{
            //    //connection.invoke("Typing");
            //    console.log("Typing", e.target.value);
            //}, 500);
            const now = Date.now();

            setMessageInput(e.target.value);

            if (now - lastSentRef.current >= 3000)
            {
                if (chat && user)
                {
                    signalR.sendTyping(chat.id, true);
                }
                lastSentRef.current = now;
            }
        };

        const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) =>
        {
            if (e.key === "Enter" && !e.shiftKey)
            {
                send();
            }
        }, [send]);

        const handleClick = useCallback(() =>
        {
            send();
        }, [send]);

        return (
            <div className="px-4 pb-4 pt-0">
                <div className="h-10">
                    <div className="max-w-8/10 mx-auto flex items-end space-x-2">
                        <Button variant="ghost" size="icon">
                            <PaperclipIcon className="h-5 w-5" />
                        </Button>

                        <div className="flex-1 relative">
                            <Input placeholder="Mesajınızı yazın..."
                                value={messageInput}
                                onChange={handleChange}
                                onKeyDown={handleKeyDown}
                                className="pr-10 bg-white" />
                            <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2">
                                <SmileIcon className="h-5 w-5" />
                            </Button>
                        </div>

                        <Button onClick={handleClick} disabled={!messageInput.trim()}>
                            <SendIcon className="h-5 w-5" />
                        </Button>
                    </div>
                </div>
            </div>
        );
    });

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

    return (
        <div className="flex-1 flex flex-col">
            <div className="border-b border-gray-200 p-4 flex items-center justify-between">
                <ChatTitle />
                {messages.length > 0 && <ChatToolBar />}
            </div>
            {messages.length > 0
                ? (
                    <div className="flex-1 flex flex-col chatArea max-h-full">
                        <MessagesArea />
                        {/*<MessageInput onSendMessage={handleSendMessage} />*/}
                        <MessageInput />
                    </div>
                )
                : (
                    <WhenEmpty />
                )}

        </div>
    );
};

export default MessageList;