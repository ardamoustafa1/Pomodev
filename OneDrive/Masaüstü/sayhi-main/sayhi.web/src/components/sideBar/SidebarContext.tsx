import React, { createContext, useContext, useState, type ReactNode } from "react"
import storage from "../../lib/storage"

interface SidebarContextType
{
    isSidebarOpen: boolean;
    toggleSidebar: () => void;
    closeSidebar: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

interface SidebarProviderProps
{
    children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) =>
{
    const preferences = storage.Preferences.get() ?? { isSidebarOpen: true };

    //const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isSidebarOpen, setIsSidebarOpen] = useState(preferences.isSidebarOpen as boolean);

    const value = {
        isSidebarOpen,
        toggleSidebar: () =>
            setIsSidebarOpen(prev =>
            {
                const newValue = !prev;
                preferences.isSidebarOpen = newValue;
                storage.Preferences.set(preferences);
                console.log("Toggling sidebar from context", newValue);
                return newValue;
            }),
        closeSidebar: () => { setIsSidebarOpen(false); }
    };

    return (
        <SidebarContext.Provider value={value}>
            {children}
        </SidebarContext.Provider>
    );
};

export const useSidebar = () =>
{
    const context = useContext(SidebarContext);

    if (context === undefined)
        throw new Error("useSidebar must be used within a SidebarProvider");

    return context;
};