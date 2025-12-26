import
    {
        MessagesSquareIcon, SettingsIcon, UserIcon, UsersIcon, Users2Icon, BellIcon, MessageSquareIcon, MessageCircleIcon,
        LayoutDashboardIcon, BotMessageSquareIcon, WorkflowIcon, CircleCheckIcon, ActivityIcon, InboxIcon, FileTextIcon
    } from "lucide-react";
import DefaultLayout from "./layouts/DefaultLayout"
import PlainLayout from "./layouts/PlainLayout"
import TodoList from "./pages/TodoList"
import Agents from "./pages/Agents"
import Agents2 from "./pages/Agents2"
import Groups from "./pages/Groups"
import Queues from "./pages/Queues"
import Inbox from "./pages/Inbox"
import Home from "./pages/home"
import Dashboard from "./pages/Dashboard"
import Reports from "./pages/Reports"
import About from "./pages/about"
import Login from "./pages/Login"
import Settings from "./pages/Settings"
import Flow from "./pages/Flow"
import Flow1 from "./pages/Flow1"
import Flow2 from "./pages/Flow2"
import Flow3 from "./pages/Flow3"

interface RouteConfig
{
    path: string;
    element: React.ReactNode;
    name?: string;
    icon?: React.ReactNode;
    badge?: string;
    hide?: boolean;
}

interface RouteGroup
{
    layout: React.ReactNode;
    routes: RouteConfig[];
}

const routeGroups: RouteGroup[] = [
    {
        layout: <DefaultLayout />,
        routes: [
            { path: "/", element: <Dashboard />, name: "Dashboard", icon: <LayoutDashboardIcon className="h-5 w-5" /> },
            { path: "/agents", element: <Agents />, name: "Agents", icon: <UserIcon className="h-5 w-5" /> },
            { path: "/agents2", element: <Agents2 />, name: "Agent Management", icon: <UserIcon className="h-5 w-5" /> },
            { path: "/groups", element: <Groups />, name: "Groups", icon: <UsersIcon className="h-5 w-5" /> },
            { path: "/queues", element: <Queues />, name: "Queues", icon: <Users2Icon className="h-5 w-5" /> },
            { path: "/hakkinda", element: <About />, name: "Hakkımızda", icon: <UserIcon className="h-5 w-5" /> },
            { path: "/todo", element: <TodoList />, name: "Tasks", icon: <CircleCheckIcon className="h-5 w-5" /> },
            { path: "/inbox", element: <Inbox />, name: "Inbox", icon: <InboxIcon className="h-5 w-5" />, badge: "3" },
            { path: "/chat1", element: <Home />, name: "Conversation", icon: <MessagesSquareIcon className="h-5 w-5" /> },
            { path: "/chat2", element: <Home />, name: "Bildirimler", icon: <BellIcon className="h-5 w-5" /> },
            { path: "/chat4", element: <Inbox />, name: "Bot", icon: <BotMessageSquareIcon className="h-5 w-5" /> },
            { path: "/flow", element: <Flow />, name: "IVR", icon: <WorkflowIcon className="h-5 w-5" /> },
            { path: "/flow1", element: <Flow1 />, name: "IVR 1", icon: <WorkflowIcon className="h-5 w-5" /> },
            { path: "/flow2", element: <Flow2 />, name: "IVR 2", icon: <MessageSquareIcon className="h-5 w-5" /> },
            { path: "/flow3", element: <Flow3 />, name: "IVR 3", icon: <MessageSquareIcon className="h-5 w-5" /> },
            { path: "/campaigns", element: <Settings />, name: "Campaigns", icon: <MessageCircleIcon className="h-5 w-5" /> },
            { path: "/templates", element: <Settings />, name: "Templates", icon: <SettingsIcon className="h-5 w-5" /> },
            { path: "/reports", element: <Reports />, name: "Reports", icon: <FileTextIcon className="h-5 w-5" /> },
            { path: "/settings", element: <Settings />, name: "Ayarlar", icon: <SettingsIcon className="h-5 w-5" /> },
            //{ path: "/kullanici/:id", element: <UserProfile />, name: "Kullanıcı Profili", icon: <Settings className="h-5 w-5" /> },
        ]
    },
    {
        layout: <PlainLayout />,
        routes: [
            { path: "/login", element: <Login />, hide: true/*, name: "Login", icon: <LogOutIcon className="h-5 w-5" />*/ },
            { path: "*", element: <h1>404 Sayfa Bulunamadı</h1>, name: "404", hide: true }
        ]
    }
];

export default routeGroups;