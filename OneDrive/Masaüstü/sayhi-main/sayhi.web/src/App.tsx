import { useEffect, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom"
import { IntlProvider } from "react-intl"
import routeGroups from "./Routes"
import storage from "./lib/storage";
//import { type User } from "./lib/Models";
import { SignalRProvider } from "./lib/signalRContext"
import { ChatStoreProvider } from "./lib/chatContext"
import { SidebarProvider } from "./components/sideBar/SidebarContext"
import "./App.css"

function App()
{
    const navigate = useNavigate();
    //const [user, setUser] = useState<User | null>(null);
    const [username, setUsername] = useState<string | null | undefined>(null);

    useEffect(() =>
    {
        const user = storage.User.get();
        const isLoggedIn = !!storage.Token.get() && user != null;

        if (!isLoggedIn)
        {
            setUsername(null);
            navigate("/login");
            return;
        }

        //setUsername(user?.name);
        //setUsername(user?.id);
        setUsername(user?.email);

    }, [navigate]);

    return (
        <IntlProvider locale={navigator.language} messages={{}}>
            <SignalRProvider username={username}>
                <ChatStoreProvider>
                    <SidebarProvider>
                        <Routes>
                            {routeGroups.map(routeGroup => (
                                <Route
                                    element={routeGroup.layout}>
                                    {routeGroup.routes.map(route => (
                                        <Route
                                            key={route.path}
                                            path={route.path}
                                            element={route.element} />
                                    ))}
                                </Route>
                            ))}
                        </Routes>
                    </SidebarProvider>
                </ChatStoreProvider>
            </SignalRProvider>
        </IntlProvider>
    );
}

export default App;