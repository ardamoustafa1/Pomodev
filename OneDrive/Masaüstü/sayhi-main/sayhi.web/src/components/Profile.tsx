import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { SettingsIcon, LogOutIcon, UserIcon, ChevronDownIcon } from "lucide-react"
import storage from "../lib/storage"

const Profile = ({ iconOnly, type }: {
    iconOnly: boolean,
    type: "name" | "nameAndEmail"
}) =>
{
    const navigate = useNavigate();
    const [avatarUrl, setAvatarUrl] = useState<string>("https://api.dicebear.com/7.x/avataaars/svg?seed=Admin");
    const [username, setUsername] = useState<string>("Edmin Yöneticizade");
    const [email, setEmail] = useState<string>("admin@example.com");

    const onExitClick = () =>
    {
        storage.Token.delete();
        //storage.User.delete();
        navigate("/login");
    };

    const onSettingsClick = () =>
    {
        navigate("/settings");
    };

    useEffect(() =>
    {
        //let avatarMap = storage.AvatarMap.get() ?? {};

        const user = storage.User.get();

        if (user && user.name && user.name.trim() !== "")
        {
            setUsername(user.name);
            setEmail(user.email);
            setAvatarUrl(user.avatar);

            /*
            if (!user.avatar || user.avatar.trim() === "")
            {
                const avatar = avatarMap[user.email];
                if (avatar)
                {
                    setAvatarUrl(avatar);
                }
                else
                {
                    getProfile(user.email)
                        .then(profile =>
                        {
                            user.avatar = profile.avatar_url;

                            avatarMap[user.email] = profile.avatar_url;
                            storage.AvatarMap.set(avatarMap);

                            setAvatarUrl(profile.avatar_url);
                        });
                }
            }
            */
        }
    }, []);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={iconOnly ? "w-full justify-center" : `w-auto ${type == "nameAndEmail" ? "mr-4" : ""} justify-start`}>
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback>AD</AvatarFallback>
                    </Avatar>
                    {!iconOnly && (
                        <>
                            <div className="flex-1 text-left">
                                <p className="text-sm font-medium text-gray-900">{username}</p>
                                {type == "nameAndEmail" && (<p className="text-xs text-gray-500">{email}</p>)}
                            </div>
                            <ChevronDownIcon className={`h-4 w-4 text-gray-400 ${type == "nameAndEmail" ? "ml-4" : ""}`} />
                        </>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Hesabım</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onSettingsClick}>
                    <SettingsIcon className="mr-2 h-4 w-4" />
                    <span>Ayarlar</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600" onClick={onExitClick}>
                    <LogOutIcon className="mr-2 h-4 w-4" />
                    <span>Çıkış</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default Profile;