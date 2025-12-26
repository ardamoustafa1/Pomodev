import React from "react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { type ChatMessage } from "../../lib/Models"

export interface Suggestion
{
    id: string;
    title: string;
    text: string;
    //createdAt: Date;
    //author: string;
}

export function GetSuggestionList(messages: ChatMessage[])
{
    // Demo amaçlı her mesaja örnek öneri ekle
    //const dummySuggestions: Record<string, Suggestion[]> = {};
    const dummySuggestions: Record<string, string[]> = {};
    messages.forEach((message) =>
    {
        if (message.isOwn)
            return;

        //const add = Math.floor(Math.random() * 2) === 1;
        //if (!add)
        //    return;

        /*
        dummySuggestions[message.id] = [{
            id: `suggestion-${message.id}-${Date.now()}`,
            //title: `"${message.text.substring(0, 15)}${message.text.length > 15 ? "..." : ""}" hakkında`,
            title: `Asistanın Önerisi`,
            text: `"${message.text.substring(0, 15)}${message.text.length > 15 ? "..." : ""}" hakkında örnek not.`
            //createdAt: new Date(),
            //author: "Sistem"
        }];
        */
        dummySuggestions[message.id] = [
            `"${message.text.substring(0, 15)}${message.text.length > 15 ? "..." : ""}" hakkında örnek not.`
        ];
    });

    return dummySuggestions;
}

//export function GetMessageWithoutSuggestion(messages: ChatMessage[], suggestions: Record<string, Suggestion[]>): ChatMessage | null
export function GetMessageWithoutSuggestion(messages: ChatMessage[], suggestions: Record<string, string[]>): ChatMessage | null
{
    for (const message of messages)
    {
        if (message.isOwn)
            continue;

        if (suggestions[message.id])
            continue;

        return message;
    }

    return null;
}

const SuggestionAccordion = ({ title, text }: { title: string, text: string }) =>
{
    return (
        <Accordion type="single" collapsible className="w-[300px]">
            <AccordionItem value="item-1">
                <AccordionTrigger>{title}</AccordionTrigger>
                <AccordionContent>
                    <p>{text}</p>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    )
};

export const SuggestionTitle = ({ showSuggestions, setShowSuggestions }: { showSuggestions: boolean; setShowSuggestions: (value: React.SetStateAction<boolean>) => void }) =>
(
    // <div className={`transition-all duration-300 ease-in-out overflow-hidden flex items-center justify-between ${showSuggestions ? "w-[300px] pl-4 border-l ml-2 opacity-100" : "w-[40px] pl-0 border-none ml-0 opacity-0"}`}>
    <>
        <div className={`transition-all duration-300 ease-in-out overflow-hidden flex items-center justify-between ${showSuggestions ? "w-[300px] pl-4 border-l ml-2" : "w-[40px] pl-4 border-l ml-2"}`}>
            {showSuggestions && <span className="font-semibold text-gray-700 whitespace-nowrap">Öneriler</span>}
            <Button
                variant={showSuggestions ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setShowSuggestions(prev => !prev)}
                title={showSuggestions ? "Önerileri Gizle" : "Önerileri Göster"}
                className={showSuggestions ? "bg-gray-100" : ""}>
                {showSuggestions
                    ? <ChevronRightIcon className={`h-5 w-5 text-blue-600`} />
                    : <ChevronLeftIcon className={`h-5 w-5 text-gray-500`} />}
            </Button>
        </div>
    </>
);

export const SuggestionArea = ({ showSuggestions }: { showSuggestions: boolean }) =>
(
    <div className={`transition-all duration-300 ease-in-out overflow-hidden bg-white ${showSuggestions ? "w-[314px] border-1 border-gray-100" : "w-0 border-none"}`} />
);

export const SuggestionColumn = ({ messageId, suggestions, showSuggestions }:
    {
        messageId: string;
        //suggestions: Record<string, Suggestion[]>;
        suggestions: Record<string, string[]>;
        showSuggestions: boolean;
    }) =>
(
    <div className={`shrink-0 flex flex-col justify-center transition-all duration-300 ease-in-out overflow-hidden ${showSuggestions ? "w-[300px] pl-4 border-l border-gray-100" : "w-0 pl-0 border-none"}`}>
        <div className="w-[280px]">
            {suggestions[messageId]?.map((suggestion, index) => (
                <div key={index} className="bg-yellow-50 p-2 rounded border border-yellow-100 text-sm mb-2">
                    <SuggestionAccordion title="Asistanın Önerisi" text={suggestion} />
                </div>
            ))}
        </div>
    </div>
);

/*
    {suggestions[messageId]?.map(suggestion => (
        <div key={suggestion.id} className="bg-yellow-50 p-2 rounded border border-yellow-100 text-sm mb-2">
            <SuggestionAccordion title={suggestion.title} text={suggestion.text} />
        </div>
    ))}
*/
