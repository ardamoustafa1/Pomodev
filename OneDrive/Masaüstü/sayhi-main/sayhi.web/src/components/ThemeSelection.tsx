import { useEffect, useState } from "react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function ThemeSelection()
{
    //const [theme, setTheme] = useState<"light" | "dark">("light");
    const [theme, setTheme] = useState<"shadcn" | "whatsup">("shadcn");

    useEffect(() =>
    {
        //setTheme(themes[themeName]);
        const id = "dynamic-css";
        let link = document.getElementById(id) as HTMLLinkElement;

        if (!link)
        {
            link = document.createElement("link");
            link.id = id;
            link.rel = "stylesheet";
            document.head.appendChild(link);
        }

        link.href = theme === "shadcn" ? "/shadcn.css" : "/whatsup.css";

        return () =>
        {
            document.head.removeChild(link);
        };
    }, [theme]);

    return (
        <div className="flex items-center space-x-2 " >
            <Switch id="airplane-mode" onCheckedChange={(checked: boolean) => setTheme(checked ? "whatsup" : "shadcn")} />
            <Label htmlFor="airplane-mode">Tema</Label>
        </div>
    );
}