import { useState, useEffect, useCallback, useRef } from "react";
import { HubConnectionBuilder, HubConnection, LogLevel, HubConnectionState } from "@microsoft/signalr";
import { type Peer } from "./Models"

export interface Message
{
    id: string;
    user: string;
    text: string;
    createdAt: Date;
    type: "system" | "user";
}

export interface MessageRequest
{
    id?: string;
    chatId: string;
    senderId: string;
    text: string;
    createdAt: Date;
}

interface HubMethods
{
    ////sendMessage: (user: string, message: string) => Promise<void>;
    //sendMessage: (messageRequest: MessageRequest) => Promise<void>;
    sendMessage: (chatId: string, text: string) => Promise<string>;
    sendTyping: (chatId: string, isTyping: boolean) => Promise<void>;
    invite: (chatId: string, recipientId: string) => Promise<void>;
    join: (chatId: string) => Promise<void>;
    leave: (chatId: string) => Promise<void>;
}
/*
interface ClientEvents
{
    ReceiveMessage: (user: string, message: string) => void;
}
*/

//const CHAT_HUB_URL = process.env.REACT_APP_SIGNALR_CHAT_URL || "/chatHub";
const CHAT_HUB_URL = "/chatHub";

const useSignalR = (username: string | null | undefined) =>
{
    const connectionRef = useRef<HubConnection | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [connectionState, setConnectionState] = useState("");
    //const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [peers, setPeers] = useState<Map<string, Peer>>(new Map());
    //const [typings, setTypings] = useState<Map<string, Set<string>>>(new Map());
    //const peersRef = useRef<Map<string, Peer>>(peers);

    const listeners = useRef<Record<string, ((...args: any[]) => void)[]>>({});

    /*
    useEffect(() =>
    {
        peersRef.current = peers;
    }, [peers]);
    
    const handleTyping = useCallback((chatId: string, senderId: string, isTyping: boolean) =>
    {
        setTypings(oldTypings =>
        {
            const _typings: Set<string> = oldTypings.get(chatId) ?? new Set<string>();
            _typings.add(senderId);
            const newTypings = new Map(oldTypings);
            newTypings.set(chatId, _typings);
            return newTypings;
        });

        listeners.current["Typing"]?.forEach(action => action(chatId, senderId, isTyping));

    }, []);
    */

    useEffect(() =>
    {
        if (!username || username.trim() === "")
        {
            connectionRef.current = null;
            setIsConnected(false);
            setConnectionState("");
            return;
        }

        if (connectionRef.current)
            return;

        const hubUrl = `${CHAT_HUB_URL}?agentname=${username}`;

        const newConnection = new HubConnectionBuilder()
            .withUrl(hubUrl)
            .withAutomaticReconnect()
            .configureLogging(LogLevel.Information)
            .build();

        connectionRef.current = newConnection;

        newConnection.onreconnecting((error) =>
        {
            console.log("Bağlantı kesildi. Yeniden bağlanılıyor...", error);
            setIsConnected(false);
            setConnectionState(connectionRef.current?.state ?? "");
        });

        newConnection.onreconnected((connectionId) =>
        {
            console.log("Bağlantı yeniden kuruldu. Yeni ID:", connectionId);
            setIsConnected(true);
            setConnectionState(connectionRef.current?.state ?? "");
        });

        newConnection.onclose((error) =>
        {
            console.error("Bağlantı tamamen kapandı.", error);
            setIsConnected(false);
            setConnectionState(connectionRef.current?.state ?? "");
            // İsteğe bağlı: Burada yeniden bağlanma denemesi başlatılabilir
        });

        //newConnection.on("ReceiveMessage", (user: string, message: string) =>
        newConnection.on("ReceiveMessage", (message: MessageRequest) =>
        {
            /*
            const from = peersRef.current.get(message.fromId);

            const newMessage: Message = {
                id: message.id,
                //chatId: message.chatId,
                user: from?.name ?? message.fromId.toString(),
                //to: message.toId,
                text: message.text,
                createdAt: message.createdAt,
                type: "user"
            };

            setMessages(prev => [...prev, newMessage]);
            */

            listeners.current["ReceiveMessage"]?.forEach(action => action(message));
        });

        newConnection.on("ReceiveSuggestion", (messageId: string, suggestions: string[]) =>
        {
            listeners.current["ReceiveSuggestion"]?.forEach(action => action(messageId, suggestions));
        });

        //newConnection.on("UserLoggedIn", (user: Peer) => listeners.current["UserLoggedIn"]?.forEach(action => action(user)));
        //newConnection.on("UserLoggedOut", (user: Peer) => listeners.current["UserLoggedOut"]?.forEach(action => action(user)));
        //newConnection.on("ActiveUsers", (users: Peer[]) => listeners.current["ActiveUsers"]?.forEach(action => action(users)));
        //newConnection.on("ActiveAgents", (users: Peer[]) => listeners.current["ActiveAgents"]?.forEach(action => action(users)));
        //newConnection.on("Typing", (chatId: string, senderId: string, isTyping: boolean) => listeners.current["Typing"]?.forEach(action => action(chatId, senderId, isTyping)));
        //newConnection.on("ReceiveRinging", (chatId: string, inviter?: Peer) => listeners.current["ReceiveRinging"]?.forEach(action => action(chatId, inviter)));
        //newConnection.on("UserJoined", (chatId: string, user: Peer) => listeners.current["UserJoined"]?.forEach(action => action(chatId, user)));
        //newConnection.on("UserLeft", (chatId: string, user: Peer) => listeners.current["UserLeft"]?.forEach(action => action(chatId, user)));

        newConnection.on("UserLoggedIn", (user: Peer) =>
        {
            setPeers(oldPeers =>
            {
                const newPeers = new Map(oldPeers);
                newPeers.set(user.id, user);
                return newPeers;
            });

            listeners.current["UserLoggedIn"]?.forEach(action => action(user));
        });

        newConnection.on("UserLoggedOut", (user: Peer) =>
        {
            setPeers(oldPeers =>
            {
                const newPeers = new Map(oldPeers);
                newPeers.delete(user.id);
                return newPeers;
            });

            listeners.current["UserLoggedOut"]?.forEach(action => action(user));
        });

        newConnection.on("ActiveUsers", (users: Peer[]) =>
        {
            setPeers(oldPeers =>
            {
                const newPeers = new Map(oldPeers);
                users.forEach(user =>
                    newPeers.set(user.id, user));

                return newPeers;
            });
            //users.forEach(user => peersRef.current.set(user.id, user));

            listeners.current["ActiveUsers"]?.forEach(action => action(users));
        });

        newConnection.on("ActiveAgents", (users: Peer[]) =>
        {
            console.table(users);

            setPeers(oldPeers =>
            {
                const newPeers = new Map(oldPeers);
                users.forEach(user =>
                    newPeers.set(user.id, user));

                return newPeers;
            });
            //users.forEach(user => peersRef.current.set(user.id, user));

            listeners.current["ActiveAgents"]?.forEach(action => action(users));
        });

        newConnection.on("Typing", (chatId: string, senderId: string, isTyping: boolean) =>
        {
            /*
            console.log("...Typing", chatId, senderId, isTyping);


            setTypings(oldTypings =>
            {
                const _typings: Set<string> = oldTypings.get(chatId) ?? new Set<string>();
                _typings.add(senderId);
                const newTypings = new Map(oldTypings);
                newTypings.set(chatId, _typings);
                return newTypings;
            });
            */

            listeners.current["Typing"]?.forEach(action => action(chatId, senderId, isTyping));
        });

        newConnection.on("ReceiveRinging", (chatId: string, caller?: Peer) =>
        {
            listeners.current["ReceiveRinging"]?.forEach(action => action(chatId, caller));
        });

        newConnection.on("ReceiveHangup", (chatId: string, caller?: Peer) =>
        {
            listeners.current["ReceiveHangup"]?.forEach(action => action(chatId, caller));
        });

        newConnection.on("UserJoined", (chatId: string, user: Peer) =>
        {
            listeners.current["UserJoined"]?.forEach(action => action(chatId, user));
        });

        newConnection.on("UserLeft", (chatId: string, user: Peer) =>
        {
            listeners.current["UserLeft"]?.forEach(action => action(chatId, user));
        });

        newConnection
            .start()
            .then(() =>
            {
                //console.log("SignalR Bağlantısı Başarılı.");
                setIsConnected(true);
                setConnectionState(connectionRef.current?.state ?? "");
            })
            .catch(ex =>
            {
                console.error("SignalR Bağlantı Hatası: ", ex);
                setError(ex.toString());
                setIsConnected(false);
                setConnectionState(connectionRef.current?.state ?? "");
            });

        return () =>
        {
            if (connectionRef.current)
            {
                /*
                newConnection.off("ReceiveMessage", (message: MessageRequest) =>
                newConnection.off("UserLoggedIn", (user: Peer) =>
                newConnection.off("UserLoggedOut", (user: Peer) =>
                newConnection.off("ActiveUsers", (users: Peer[]) =>
                newConnection.off("ActiveAgents", (users: Peer[]) =>
                newConnection.off("Typing", (chatId: string, senderId: string, isTyping: boolean) =>
                newConnection.off("ReceiveRinging", (chatId: string, inviter?: Peer) =>
                newConnection.off("UserJoined", (chatId: string, user: Peer) =>
                newConnection.off("UserLeft", (chatId: string, user: Peer) =>
                */

                connectionRef.current.stop();
                connectionRef.current = null;
                setIsConnected(false);
                setConnectionState("");
            }
        };
    }, [username]);

    async function serverProcedureCall(action: (connection: HubConnection) => Promise<any | void>)
    {
        const connection = connectionRef.current;
        //if (connection && isConnected)
        if (connection && connection.state === HubConnectionState.Connected)
        {
            try
            {
                return await action(connection);
            }
            catch (ex)
            {
                console.error("Mesaj gönderme hatası:", ex);
                //return `${ex}`;
                return ex;
            }
        }
        else
        {
            console.warn("Mesaj gönderilemedi, bağlantı yok.");
        }
        //return "";
    }

    //const sendMessage: HubMethods["sendMessage"] = useCallback(async (messageRequest) =>
    const sendMessage: HubMethods["sendMessage"] = useCallback(async (chatId: string, text: string) =>
    {
        return await serverProcedureCall(async (connection) =>
        {
            await connection.invoke("SendMessage", chatId, text);
        });
    }, [connectionRef]);

    const sendTyping: HubMethods["sendTyping"] = useCallback(async (chatId: string, isTyping: boolean) =>
    {
        return await serverProcedureCall(async (connection) =>
        {
            await connection.invoke("sendTyping", chatId, isTyping);
        }); 
    }, [connectionRef]);

    const invite: HubMethods["invite"] = useCallback(async (chatId: string, recipientId: string) =>
    {
        return await serverProcedureCall(async (connection) =>
        {
            await connection.invoke("invite", chatId, recipientId);
        });
    }, [connectionRef]);

    const join: HubMethods["join"] = useCallback(async (chatId: string) =>
    {
        return await serverProcedureCall(async (connection) =>
        {
            await connection.invoke("join", chatId);
        });
    }, [connectionRef]);

    const leave: HubMethods["leave"] = useCallback(async (chatId: string) =>
    {
        return await serverProcedureCall(async (connection) =>
        {
            await connection.invoke("leave", chatId);
        });
    }, [connectionRef]);

    const on = useCallback((eventName: string, handler: (...args: any[]) => void) =>
    {
        if (!listeners.current[eventName])
            listeners.current[eventName] = [];

        listeners.current[eventName].push(handler);

        return () =>
        {
            listeners.current[eventName] = listeners.current[eventName].filter(h => h !== handler);
        };
    }, []);

    const off = useCallback((eventName: string, handler: (...args: any[]) => void) =>
    {
        if (!listeners.current[eventName])
            listeners.current[eventName] = [];

        listeners.current[eventName] = listeners.current[eventName].filter(h => h !== handler);
    }, []);

    //listeners.current["ReceiveMessage"]?.forEach(action => action(message));

    return {
        isConnected,
        connectionState,
        //messages,
        peers,
        //typings,
        error,
        on,
        off,
        sendMessage,
        sendTyping,
        invite,
        join,
        leave
    };
};

export default useSignalR;