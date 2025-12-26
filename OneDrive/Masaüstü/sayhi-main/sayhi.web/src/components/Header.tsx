import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SearchIcon, BellIcon } from "lucide-react"
import { useSignalRContext } from "../lib/signalRContext"
import Profile from "./Profile"
import ThemeSelection from "./ThemeSelection"

const Header = () =>
{
    //const { isSidebarOpen, toggleSidebar } = useSidebar();
    //const { isConnected, connectionState } = useSignalRContext();
    const { isConnected } = useSignalRContext();

    return (
        <header className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
                <div className="flex-1 max-w-md">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input placeholder="Ara..." className="pl-10" />
                    </div>
                </div>

                <div className="flex items-center space-x-4">

                    <ThemeSelection />

                    <Button variant="ghost" size="icon" className="relative" aria-label="Bildirimler">
                        <BellIcon />
                        <span className={`absolute top-1 right-1 w-2 h-2 ${isConnected ? "bg-green-500" : "bg-red-500"} rounded-full`} />
                    </Button>

                    <Profile iconOnly={false} type="name" />

                </div>
            </div>
        </header>
    );
};

export default Header;