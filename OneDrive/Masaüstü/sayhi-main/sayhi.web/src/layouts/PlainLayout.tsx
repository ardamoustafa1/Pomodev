import { Outlet } from "react-router-dom"

const PlainLayout = () =>
{
    return (
        <div className="flex h-screen w-screen bg-gray-50">
            <Outlet />
        </div>
    );
};

export default PlainLayout;