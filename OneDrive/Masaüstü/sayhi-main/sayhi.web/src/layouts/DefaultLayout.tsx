import { Outlet } from "react-router-dom"
import Sidebar from "../components/sideBar/Sidebar"
import Header from "../components/Header"
//import { useSidebar } from "../components/SidebarContext";

const DefaultLayout = () =>
{
    //const { isSidebarOpen } = useSidebar();

    return (
        <div className="flex h-screen w-screen bg-gray-50">
            <Sidebar />

            {/*
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
            */}
            {/*
            <Outlet />
            <div className={`flex flex-col flex-1 transition-all duration-300 ${isSidebarOpen ? "md:ml-0" : "md:ml-0"}`}>
            */}
            <div className="flex-1 flex flex-col">

                <Header />
                <main className="flex-1 min-h-0 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DefaultLayout;