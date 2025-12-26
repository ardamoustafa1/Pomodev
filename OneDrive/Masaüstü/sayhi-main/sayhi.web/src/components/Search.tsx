import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { XIcon, SearchIcon } from "lucide-react"

export default function Search({ placeholder }: { placeholder?: string; })
{
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="relative flex-1 w-full sm:max-w-md">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
                type="text"
                placeholder={placeholder || "Ara..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10" />
            {searchTerm && (
                <Button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <XIcon className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
}