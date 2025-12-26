import { Link, useLocation } from "react-router-dom"
import routeGroups from "../../Routes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MenuIcon, BotMessageSquareIcon } from "lucide-react";
import { useSidebar } from "./SidebarContext";
import Profile from "../Profile";

const Sidebar = () =>
{
    const { isSidebarOpen, toggleSidebar } = useSidebar();
    const location = useLocation();

    return (
        <aside className={`${isSidebarOpen ? "w-64" : "w-16"} flex flex-col border-r border-gray-200 transition-all duration-300`}>
            <div className="p-4 border-b border-gray-200 flex ">
                <Button variant="ghost" size="icon" onClick={toggleSidebar}>
                    <MenuIcon className="h-5 w-5" />
                </Button>
                {isSidebarOpen && (
                    <div className="flex text-center items-center justify-center ml-4">
                        <div className="inline-flex items-center justify-center size-8 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg mr-2 aspect-square">
                            <BotMessageSquareIcon className="size-4 text-white" />
                        </div>
                        <h1 className="text-xl font-bold text-gray-800">Say Hi!</h1>
                    </div>
                )}
            </div>

            {/*
            <div className="flex-1 flex flex-col-reverse overflow-y-auto pt-4 pb-0 px-6 max-w-[80%] w-full place-self-center">
            */}
            <ScrollArea className="flex-1 overflow-y-auto">
                <nav className="p-2 space-y-1">
                    {routeGroups.map(routeGroup =>
                        routeGroup
                            .routes
                            .filter(route => !route.hide)
                            .map(route => (
                                <Link key={route.path} to={route.path}>
                                    <Button
                                        variant={route.path == location.pathname ? "default" : "ghost"}
                                        className={`w-full ${isSidebarOpen ? "justify-start" : "justify-center"} ${route.path == location.pathname ? "" : "hover:bg-gray-200"}`}>
                                        {isSidebarOpen && (
                                            <div className="flex items-center justify-between">
                                                {route.icon}
                                                {isSidebarOpen && <span className="ml-3">{route.name}</span>}
                                                {route.badge && (<Badge className="ml-2">{route.badge}</Badge>)}
                                            </div>)}
                                        {!isSidebarOpen && (
                                            <>
                                                {route.icon}
                                                {isSidebarOpen && <span className="ml-3">{route.name}</span>}
                                            </>)}
                                    </Button>
                                </Link>
                            ))
                    )}
                </nav>
            </ScrollArea>

            <div className="p-4 border-t border-gray-200">
                <Profile iconOnly={!isSidebarOpen} type="nameAndEmail" />
            </div>

        </aside>
    );
};

export default Sidebar;