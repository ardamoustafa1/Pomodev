import { createContext, useContext, useRef, useState, useCallback, useSyncExternalStore } from "react"
import { type Chat, type ChatMessage, type User, type Peer, type InteractionInfo, AlertType, SourceType } from "./Models"
import storage from "./storage"
import { isGroupChat } from "./utils"
import { useSignalRContext, type SignalRContextType } from "./signalRContext"
import { type MessageRequest } from "./signalRHook"
import RingingDialog from "../components/RingingDialog"

interface ChatState
{
    chats: Chat[];
    chat: Chat | undefined;
    messages: ChatMessage[];
    suggestions: Record<string, string[]>;
    showRinging: boolean;
    setShowRinging: (isRinging: boolean) => void;
    interaction: InteractionInfo;
    setInteraction: (interaction: InteractionInfo) => void;
}

function update<T>(
    array: T[],
    where: (item: T) => boolean,
    action: (item: T, index: number) => void)
{
    const index = array.findIndex(where);
    if (index !== -1)
    {
        action(array[index], index);
    }
}

/*
function update2<T>(
    array: T[],
    where: (item: T) => boolean,
    action: (index: number) => T)
{
    const index = array.findIndex(where);
    if (index !== -1)
    {
        array[index] = action(index);
    }
}
*/

class ChatStore
{
    private state: ChatState = {} as ChatState;
    private listeners = new Set<() => void>();
    private signalR: SignalRContextType | null = null;
    private user: User | null = null;
    private intervalId: number | null = null;

    constructor()
    {
        if (typeof window !== "undefined")
        {
            (window as any).__chatStore = this;
        }

        this.user = storage.User.get();

        //this.state.chats = new Map();
        this.state.chats = [];
        this.state.messages = [];
        this.state.suggestions = {};

        this.signalR = useSignalRContext();
        this.signalR.on("ReceiveMessage", this.signalR_onReceiveMessage);
        this.signalR.on("ReceiveSuggestion", this.signalR_onReceiveSuggestion);
        this.signalR.on("UserLoggedIn", this.signalR_onUserLoggedIn);
        this.signalR.on("UserLoggedOut", this.signalR_onUserLoggedOut);
        this.signalR.on("Typing", this.signalR_onTyping);
        this.signalR.on("ActiveUsers", this.signalR_onActiveUsers);
        this.signalR.on("ActiveAgents", this.signalR_onActiveAgents);
        this.signalR.on("ReceiveRinging", this.signalR_onReceiveRinging);
        this.signalR.on("ReceiveHangup", this.signalR_onReceiveHangup);
        this.signalR.on("UserJoined", this.signalR_onUserJoined);
        this.signalR.on("UserLeft", this.signalR_onUserLeft);

        this.startTimer();
    }

    public dispose(): void
    {
        if (this.signalR)
        {
            this.signalR.off("ReceiveMessage", this.signalR_onReceiveMessage);
            this.signalR.off("ReceiveSuggestion", this.signalR_onReceiveSuggestion);
            this.signalR.off("UserLoggedIn", this.signalR_onUserLoggedIn);
            this.signalR.off("UserLoggedOut", this.signalR_onUserLoggedOut);
            this.signalR.off("Typing", this.signalR_onTyping);
            this.signalR.off("ActiveUsers", this.signalR_onActiveUsers);
            this.signalR.off("ActiveAgents", this.signalR_onActiveAgents);
            this.signalR.off("ReceiveRinging", this.signalR_onReceiveRinging);
            this.signalR.off("ReceiveHangup", this.signalR_onReceiveHangup);
            this.signalR.off("UserJoined", this.signalR_onUserJoined);
            this.signalR.off("UserLeft", this.signalR_onUserLeft);
            this.signalR = null;
        }
    }

    subscribe = (listener: () => void) =>
    {
        this.listeners.add(listener);

        if (this.listeners.size === 1)
        {
            this.startTimer();
        }

        return () =>
        {
            this.listeners.delete(listener);

            if (this.listeners.size === 0)
            {
                this.stopTimer();
            }
        };
    };

    private notify = () =>
    {
        this.listeners.forEach(listener => listener());
    };

    getSnapshot = () => this.state;

    getState = () => this.state;

    getChats = () => this.state.chats;
    /*
        //.filter
        .map(c =>
        {
            const typings: Set<string> = this.signalR?.typings.get(c.id) ?? {} as Set<string>;
            return ({
                ...c,
                participants: c.participants
                    .map(p => ({
                        ...p,
                        isOnline: this.signalR?.peers.get(p.id) ? true : false
                    })),
                //typings: c.participants
                //    .map(p => p.id)
                //    .filter(id => typings.has(id))
                typings: Array.from(typings)
            });
        });
    */

    get selectedChatId(): string | undefined
    {
        return this.state.chat?.id;
    }

    set selectedChatId(chatId: string | undefined) 
    {
        console.log("selectedChatId:", chatId);

        this.state = {
            ...this.state,
            chat: chatId
                ? this.state.chats.find(c => c.id === chatId)
                : undefined
        };

        this.notify();
    }

    get messages(): ChatMessage[]
    {
        return this.state.messages;
    }

    set messages(value: ChatMessage[]) 
    {
        this.state = {
            ...this.state,
            messages: value
        };

        this.notify();
    }

    addMessage = (newMessage: ChatMessage) =>
    {
        this.state = {
            ...this.state,
            messages: [newMessage, ...this.state.messages]
        };

        this.notify();
    }

    get suggestions(): Record<string, string[]>
    {
        return this.state.suggestions;
    }

    /*
    set suggestions(value: Record<string, string[]>) 
    {
        console.log("suggestions:", value);

        this.state = {
            ...this.state,
            suggestions: value
        };

        this.notify();
    }
    */

    setSuggestions = (/*chatId: string,*/ messageId: string, suggestions: string[]) =>
    {
        const _suggestions = this.state.suggestions || {};
        _suggestions[messageId] = suggestions;

        this.state = {
            ...this.state,
            suggestions: _suggestions
        };

        this.notify();
    }

    sendMessage = (chatId: string | undefined, text: string) =>
    {
        if (!chatId)
            return;

        return this.signalR?.sendMessage(chatId, text);
    }

    sendTyping = (chatId: string| undefined, isTyping: boolean) =>
    {
        if (!chatId)
            return;

        this.signalR?.sendTyping(chatId, isTyping);
    }

    invite = (chatId: string, recipientId: string) =>
    {
        this.signalR?.invite(chatId, recipientId);
    }

    join = (chatId: string) =>
    {
        this.signalR?.join(chatId);
    }

    leave = (chatId: string) =>
    {
        this.signalR?.leave(chatId);
    }

    setChats = (chats: Chat[]) =>
    {
        for (const _chat of chats)
        {
            this.updateChat(_chat);
        }

        this.state.chats = [...chats];

        this.notify();
    }

    get interaction(): InteractionInfo
    {
        return this.state.interaction;
    }

    showRinging = (interaction: InteractionInfo) =>
    {
        this.state.setInteraction(interaction);

        this.state.setShowRinging(true);
    };

    hideRinging = () =>
    {
        //this.state.setInteraction({});

        this.state.setShowRinging(false);
    };

    answer = (interaction: InteractionInfo) =>
    {
        //this.state.setInteraction(interaction);
        //this.state.setShowRinging(false);
        console.log("...answer", interaction);

        /*
        interaction.name: "",
        interaction.phone: "",
        interaction.message: "....",
        interaction.caller.connectionId: "DGv4N7BYJZ2Hr_5gh6cnlA"
        interaction.caller.id: "019abd07-7aa9-7e56-be87-e6ba5121ab87"
        interaction.caller.name: "user_6ft730zginu9392"
        interaction.caller.type: 1
        */

        this.addChat({
            id: interaction.id,
            name: "",
            participants: [
                {
                    //id: interaction.caller.id,
                    //name: interaction.caller.name,
                    //email: interaction.caller.email,
                    //avatar: interaction.caller.avatar,
                    ...interaction.caller,
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
    };

    hangup = (interaction: InteractionInfo) =>
    {
        //this.state.setInteraction({});
        //this.state.setShowRinging(false);
        console.log("...hangup");
        console.log(interaction);
    };

    addChat = (_chat: Chat) =>
    {
        this.updateChat(_chat);

        //console.log(".............");
        //console.log(".............");
        //console.log(this.state.chats);
        //console.log(_chat);

        let existingChat = this.state.chats.find(c => c.id === _chat.id);
        let updatedChats = [];

        if (existingChat)
        {
            existingChat.source = _chat.source;
            existingChat.tags = _chat.tags;

            for (const participant of _chat.participants)
            {
                const existingParticipant = existingChat.participants.find(p => p.id === participant.id);
                if (!existingParticipant)
                {
                    existingChat.participants.unshift(participant);
                }
            }
            //existingChat.participantMap = new Map<string, ChatParticipant>(existingChat
            //      .participants
            //      .map(participant => [participant.id, participant]))

            updatedChats = [...this.state.chats];
        }
        else
        {
            updatedChats = [...this.state.chats, _chat];
        }

        this.state = {
            ...this.state,
            //chats: [...this.state.chats, _chat]
            chats: updatedChats
        };

        this.notify();
    };

    updateTyping = (chatId: string, senderId: string, isTyping: boolean) =>
    {
        const now = Date.now();

        update(this.state.chats, c => c.id === chatId, (_chat) =>
        {
            if (!_chat.typings)
            {
                _chat.typings = new Map<string, number>();
            }

            if (isTyping)
            {
                _chat.typings.set(senderId, now);
            }
            else
            {
                _chat.typings.delete(senderId);
            }

            _chat.typingIndicator = this.getTyping(_chat);
        });

        this.state = {
            ...this.state,
            chats: [...this.state.chats]
        };

        /*
        if (this.state.chat?.id === chatId &&
            this.user?.id !== senderId)
        {
            this.notify();  
        }
        */

        this.notify();
    };

    markAsRead = (chatId: string) =>
    {
        update(
            this.state.chats,
            c => c.id === chatId,
            (_chat) =>
            {
                _chat.unreadCount = 0;
                this.notify();
            });
    };

    private updateChat(_chat: Chat)
    {
        //const typingIds: Set<string> = this.signalR?.typings.get(_chat.id) ?? {} as Set<string>;
        const typingIds = new Set<string>();

        _chat.participants.forEach(p =>
        {
            p.isOnline = this.signalR?.peers.get(p.id) ? true : false;
        });

        const now = Date.now();

        //_chat.typings = Array.from(typingIds);

        /*
        if (!_chat.typings)
        {
            _chat.typings = new Map<string, number>();
        }

        for (const typingId of typingIds)
        {
            _chat.typings.set(typingId, now);
        }
        */

        _chat.typings = new Map(Array.from(typingIds).map(i => [i, now]));

        //Array.from(_chat.typings).map(([k, v]) => console.log(k, v));
    }

    /*
    private updateChat2(_chat: Chat): Chat
    {
        const typingIds: Set<string> = this.signalR?.typings.get(_chat.id) ?? {} as Set<string>;

        const now = Date.now();

        return ({
            ..._chat,
            participants: _chat.participants
                .map(p => ({
                    ...p,
                    isOnline: this.signalR?.peers.get(p.id) ? true : false
                })),
            //typingIds: c.participants
            //    .map(p => p.id)
            //    .filter(id => typingIds.has(id))
            //typings: Array.from(typingIds)
            typings: new Map(Array.from(typingIds).map(i => [i, now]))
        });
    }
    */

    private getTyping(_chat: Chat): string | undefined
    {
        if (_chat.typings.size === 0)
            return undefined;

        if (_chat.typings.size > 1)
            return `${_chat.typings.size} people typing...`;

        //const chatTitle = getChatTitle(_chat);
        const typingParticipant = _chat.participants.find(p => p.id === _chat.typings.keys().next().value);
        const firstParticipantsId = _chat.participants.length > 0 ? _chat.participants[0].id : undefined;

        if (typingParticipant?.id === this.user?.id)
            return undefined;

        return firstParticipantsId === typingParticipant?.id && !isGroupChat(_chat)
            ? "typing..."
            : `${typingParticipant?.name} is typing...`;
    }

    private loop = () =>
    {
        try
        {
            this.stopTyping();
        }
        finally
        {
            this.runLoop();
        }
    }

    private runLoop = () =>
    {
        this.intervalId = setTimeout(this.loop, 2000);
    }

    private startTimer()
    {
        if (typeof window === "undefined")
            return;

        this.stopTimer();
        this.runLoop();
    }

    private stopTimer()
    {
        if (this.intervalId)
        {
            clearTimeout(this.intervalId);
            this.intervalId = null;
        }
    }

    private stopTyping()
    {
        const now = Date.now();

        for (const _chat of this.state.chats)
        {
            if (_chat.typings.size > 0)
            {
                _chat
                    .typings
                    .forEach((timespan, participantId) =>
                    {
                        //console.log(`m[${participantId}] = ${timespan}`, now - timespan);
                        if (now - timespan > 5000)
                        {
                            this.updateTyping(_chat.id, participantId, false);
                        }
                    });

            }
        }
    }

    private signalR_onReceiveMessage = (message: MessageRequest) =>
    {
        console.log("ReceiveMessage", message);
        /*
        this.addMessage(chatId,
        {
            id: crypto.randomUUID(),
            chatId,
            userName,
            content,
            timestamp: new Date(timestamp),
            isAi: userName === "AI Assistant"
        });
        */

        //let user = storage.User.get();

        if (!this.user || !this.state.chat)
            return;

        if (this.state.chat.id !== message.chatId)
            return;

        const newMessage: ChatMessage = {
            id: message.id ?? "",
            text: message.text,
            createdAt: message.createdAt,
            senderId: message.senderId,
            isOwn: message.senderId === this.user.id,
            status: "Delivered"
        };

        this.addMessage(newMessage);
    };
    private signalR_onReceiveSuggestion = (messageId: string, suggestions: string[]) =>
    {
        console.log("ReceiveSuggestion", messageId, suggestions);

        this.setSuggestions(messageId, suggestions);
    };
    private signalR_onUserLoggedIn = (peer: Peer) =>
    {
        console.log("UserLoggedIn", peer, this.user);
    };
    private signalR_onUserLoggedOut = (peer: Peer) =>
    {
        console.log("UserLoggedIn", peer);
    };
    private signalR_onTyping = (chatId: string, senderId: string, isTyping: boolean) =>
    {
        this.updateTyping(chatId, senderId, isTyping);
    };
    private signalR_onActiveUsers = (peers: Peer[]) =>
        console.log("ActiveUsers", peers);
    private signalR_onActiveAgents = (peers: Peer[]) =>
        console.log("ActiveAgents", peers);
    private signalR_onReceiveRinging = (chatId: string, caller: Peer) =>
    {
        console.log("ReceiveRinging", chatId, caller);
        
        this.showRinging({
            id: chatId,
            caller,
            //name: `${caller.name}`,
            name: "",
            phone: "",
            message: "Merhaba! Sana bir şey sormak istiyorum, müsait misin?"
        });
    };
    private signalR_onReceiveHangup = (chatId: string, caller: Peer) =>
    {
        console.log("ReceiveHangup", chatId, caller);
        this.hideRinging();
    };
    private signalR_onUserJoined = (chatId: string, peer: Peer) =>
        console.log("UserJoined", chatId, peer);
    private signalR_onUserLeft = (chatId: string, peer: Peer) =>
        console.log("UserLeft", chatId, peer);
}

const ChatStoreContext = createContext<ChatStore | null>(null);

export const ChatStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) =>
{
    const [showRinging, setShowRinging] = useState(false);
    const [interaction, setInteraction] = useState<InteractionInfo>();
    const storeRef = useRef<ChatStore>(null);

    if (!storeRef.current)
    {
        storeRef.current = new ChatStore();
    }

    //storeRef.current.setShowRinging = setShowRinging;
    //storeRef.current.setInteraction = setInteraction;

    storeRef.current.getState().setShowRinging = setShowRinging;
    storeRef.current.getState().setInteraction = setInteraction;

    return (
        <ChatStoreContext.Provider value={storeRef.current}>
            {children}
            <RingingDialog
                isVisible={showRinging}
                setIsVisible={setShowRinging}
                interaction={interaction} />
        </ChatStoreContext.Provider>
    );
};

export const useChatStore = () =>
{
    const store = useContext(ChatStoreContext);

    if (!store)
        throw new Error("useChatStore must be used within ChatStoreProvider");

    return store;
};

export const useChatStateAndStore = () =>
{
    const store = useChatStore();

    const chatState = useSyncExternalStore(
        store.subscribe,
        () => store.getSnapshot(),
        () => store.getSnapshot()
    );

    return { chatState, chatStore: store };
};

export const useChatState = () =>
{
    const store = useChatStore();

    const chatState = useSyncExternalStore(
        store.subscribe,
        () => store.getSnapshot(),
        () => store.getSnapshot()
    );

    return chatState;
};

export const useSelectedChatAndStore = () =>
{
    const store = useChatStore();

    const chat = useSyncExternalStore(
        store.subscribe,
        () => store.getSnapshot().chat,
        () => store.getSnapshot().chat
    );

    return { chat, chatStore: store };
};

export const useChats = () =>
{
    const store = useChatStore();

    const chats = useSyncExternalStore(
        store.subscribe,
        () => store.getChats(),
        () => store.getChats(),
    );

    return { chats, chatStore: store };
};

export const useChat = (chatId: string) =>
{
    const store = useChatStore();

    const chat = useSyncExternalStore(
        store.subscribe,
        () => store.getChats().find(c => c.id === chatId),
        () => store.getChats().find(c => c.id === chatId)
    );

    return { chat, chatStore: store };
};

export const useSelectedChat = () =>
{
    const store = useChatStore();

    return useSyncExternalStore(
        store.subscribe,
        () => store.getSnapshot().chat,
        () => store.getSnapshot().chat
    );
};

export const useChatActions = () =>
{
    const store = useChatStore();

    return {
        //joinChat: useCallback((chatId: string, userName: string) =>
        //    store.joinChat(chatId, userName), [store]),
        //sendMessage: useCallback((chatId: string, userName: string, content: string) =>
        //    store.sendMessage(chatId, userName, content), [store]),
        //triggerAI: useCallback((chatId: string, question: string) =>
        //    store.triggerAI(chatId, question), [store]),
        markAsRead: useCallback((chatId: string) =>
            store.markAsRead(chatId), [store]),
        //updateTyping: useCallback((chatId: string, isTyping: boolean) =>
        updateTyping: useCallback((chatId: string, senderId: string, isTyping: boolean) =>
            store.updateTyping(chatId, senderId, isTyping), [store]),
        setChats: useCallback((chats: Chat[]) =>
            store.setChats(chats), [store]),
        addChat: useCallback((_chat: Chat) =>
            store.addChat(_chat), [store]),
        getSelectedChat: useCallback(() =>
            store.selectedChatId, [store]),
        setSelectedChat: useCallback((chatId: string) =>
            store.selectedChatId = chatId, [store])
    };
};
