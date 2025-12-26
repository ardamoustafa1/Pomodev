import React, { useState, useRef, useCallback, memo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { SendIcon, PaperclipIcon, SmileIcon } from "lucide-react"

const MessageInput = memo(({ sendMessage, sendTyping }: {
    sendMessage: (messageInput: string) => void;
    sendTyping: () => void;
}) =>
{
    const [messageInput, setMessageInput] = useState("");

    const send = useCallback(() =>
    {
        if (messageInput.trim())
        {
            sendMessage(messageInput);
            setMessageInput("");
        }
    }, [messageInput]);

    const lastSentRef = useRef<number>(0);
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const now = Date.now();

        setMessageInput(e.target.value);

        if (now - lastSentRef.current >= 3000)
        {
            sendTyping();
            lastSentRef.current = now;
        }
    };

    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) =>
    {
        if (e.key === "Enter" && !e.shiftKey)
        {
            send();
        }
    }, [send]);

    return (
        <div className="px-4 pb-4 pt-0">
            <div className="h-10">
                <div className="flex items-end space-x-2">
                    <Button variant="ghost" size="icon">
                        <PaperclipIcon className="h-5 w-5" />
                    </Button>
                    <div className="flex-1 relative">
                        <Input placeholder="Mesajınızı yazın..."
                            value={messageInput}
                            onChange={handleChange}
                            onKeyDown={handleKeyDown}
                            className="pr-10 bg-white" />
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2"><SmileIcon className="h-5 w-5" /></Button>
                    </div>
                    <Button onClick={send} disabled={!messageInput.trim()}>
                        <SendIcon className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
});

export default MessageInput;