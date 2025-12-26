import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type Chat, type ChatMessage } from "./Models"

export function cn(...inputs: ClassValue[])
{
    return twMerge(clsx(inputs))
}

export function getInitials(name: string)
{
    return name
        .split(" ")
        .map(n => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

export function isGroupChat(chat: Chat): boolean
{
    return (chat.name && chat.name.trim().length > 0) ? true : false;
}

export function shouldShowAvatar(chat: Chat, messages: ChatMessage[], index: number): boolean
{
    //if (!chat || !isGroupChat(chat))
    if (!isGroupChat(chat))
        return false;

    const message = messages[index];

    if (message.isOwn)
        return false;

    //if (index === 0)
    //    return true;

    const prevMessage = messages[index + 1];

    if (!prevMessage)
        return true;

    return prevMessage.senderId !== message.senderId;
}

export function getChatTitle(chat?: Chat): string | null
{
    if (!chat)
        return null;

    if (isGroupChat(chat))
        return chat.name;

    //if (chat.participantMap.size > 0)
    //	return chat.participantMap.values().next().value?.name ?? null;

    if (chat.participants.length > 0)
        return chat.participants[0].name;

    return null;
}

/*
export type Property = {
    id: string;
    label: string;
    required?: boolean;
    placeholder?: string;
    type?: "text" | "number" | "email" | "select" | "date" | "checkbox";
    options?: { label: string; value: string }[];
};

export function buildProperties<T extends object>(): Property[]
{
    const sample: Partial<T> = {} as T;

    const keys = Object.keys(sample) as (keyof T)[];

    console.warn(keys);
    return keys.map((key) =>
    {
        const type = typeof (sample[key] as any);

        let inputType: string | undefined;
        switch (type)
        {
            case "string":
                inputType = "text";
                break;
            case "boolean":
                inputType = "checkbox";
                break;
            case "number":
                inputType = "number";
                break;
            default:
                inputType = "text";
                break;
        }

        return {
            id: key as string,
            label: capitalize(key as string),
            type: inputType,
            required: !isOptional<T>(key)
        } as Property;
    });
}

function capitalize(str: string)
{
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function isOptional<T>(_key: keyof T): boolean
{
    return false; // runtime'da tespit edilemez, manuel eklenebilir
}
*/