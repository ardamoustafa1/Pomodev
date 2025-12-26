import React, { createContext, useContext } from "react"
import useSignalR from "./signalRHook"

export type SignalRContextType = ReturnType<typeof useSignalR>;

const SignalRContext = createContext<SignalRContextType | null>(null);

export const SignalRProvider = ({ username, children }: {
    username: string | null | undefined;
    children: React.ReactNode
}) =>
{
    const signalR = useSignalR(username);
    return <SignalRContext.Provider value={signalR}>
        {children}
    </SignalRContext.Provider>;
};

export const useSignalRContext = () =>
{
    const context = useContext(SignalRContext);
    if (!context)
        throw new Error("useSignalRContext must be used inside <SignalRProvider>");
    return context;
};
