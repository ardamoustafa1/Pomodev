/*
import React, { useState } from "react";
import { AgentStatus, type CreateAgentRequest } from "../../lib/Models"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UserPlus, Loader2 } from "lucide-react"

const createAgentSchema = z.object({
    personId: z.string().min(1, "Person ID is required"),
    status: z.number().default(AgentStatus.Available),//.refine(val => val !== undefined)
    employeeId: z.string().optional(),
    groupId: z.string().optional()
});

interface CreateAgentModalProps
{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateAgentRequest) => void;
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
    isOpen,
    onClose,
    onSubmit
}) =>
{
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof createAgentSchema>>({
        resolver: zodResolver(createAgentSchema),
        defaultValues: {
            personId: "",
            status: AgentStatus.Available,
            employeeId: "",
            groupId: ""
        }
    });

    const handleSubmit = async (values: z.infer<typeof createAgentSchema>) =>
    {
        setIsSubmitting(true);
        try
        {
            await onSubmit(values);
            form.reset();
        }
        catch (error)
        {
            console.error("Failed to create agent:", error);
        }
        finally
        {
            setIsSubmitting(false);
        }
    };

    const handleClose = () =>
    {
        form.reset();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Create New Agent
                    </DialogTitle>
                    <DialogDescription>
                        Add a new agent to your call center. Fill in the required information below.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="personId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Person ID *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter person ID..."
                                            {...field} />
                                    </FormControl>
                                    <FormDescription>
                                        The unique identifier for the person record
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="employeeId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Employee ID</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter employee ID (optional)..."
                                            {...field}
                                            value={field.value || ""} />
                                    </FormControl>
                                    <FormDescription>
                                        Optional employee identification number
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="groupId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Group</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select group" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="sales">Sales Team</SelectItem>
                                                <SelectItem value="technical">Technical Support</SelectItem>
                                                <SelectItem value="support">Customer Service</SelectItem>
                                                <SelectItem value="vip">VIP Support</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Initial Status</FormLabel>
                                        <Select
                                            onValueChange={(value) => field.onChange(parseInt(value))}
                                            defaultValue={field.value.toString()}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {Object.entries(AgentStatus)
                                                    .filter(([key]) => isNaN(Number(key)))
                                                    .map(([key, value]) => (
                                                        <SelectItem key={value} value={value.toString()}>
                                                            {key}
                                                        </SelectItem>
                                                    ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isSubmitting}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? (<>
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        Creating...
                                    </>)
                                    : (<>
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        Create Agent
                                    </>)}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
*/