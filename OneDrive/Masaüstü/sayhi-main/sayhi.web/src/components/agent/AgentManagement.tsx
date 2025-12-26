import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { AlertCircleIcon, PlusIcon, SearchIcon, FilterIcon, Loader2Icon, UsersIcon } from "lucide-react"
import { useAgents } from "./useAgents"
import { AgentStatus } from "../../lib/Models"
import { AgentCard } from "./AgentCard2"
import { CreateAgentModal } from "./CreateAgentModal2"
import { AgentFilters } from "./AgentFilters2"

export const AgentManagement = () =>
{
    const { agents, loading, error, loadAgents, createAgent, updateAgentStatus, deleteAgent } = useAgents();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [filters, setFilters] = useState({ groupId: "", status: "" });

    const handleFilterChange = (newFilters: { groupId?: string; status?: string }) =>
    {
        const updatedFilters = { ...filters, ...newFilters };
        setFilters(updatedFilters);
        loadAgents(1, updatedFilters.groupId, updatedFilters.status ? parseInt(updatedFilters.status) : undefined);
    };

    const handleStatusChange = async (agentId: string, newStatus: AgentStatus) =>
    {
        await updateAgentStatus(agentId, newStatus);
    };

    const handleDelete = async (agentId: string) =>
    {
        if (window.confirm("Are you sure you want to delete this agent?"))
        {
            await deleteAgent(agentId);
        }
    };

    const handleCreateAgent = async (data: any) =>
    {
        const success = await createAgent(data);
        if (success)
        {
            setShowCreateModal(false);
        }
    };

    console.log(agents);
    const filteredAgents = agents.filter(agent =>
        agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        agent.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="container mx-auto px-6 py-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Agent Management</h1>
                    <p className="text-muted-foreground mt-2">
                        Manage your call center agents and their assignments
                    </p>
                </div>
                <Button onClick={() => setShowCreateModal(true)} className="gap-2">
                    <PlusIcon className="h-4 w-4" />
                    Add New Agent
                </Button>
            </div>

            {error && (
                <Card className="border-destructive bg-destructive/10 mb-6">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2 text-destructive">
                            <AlertCircleIcon className="h-4 w-4" />
                            <span>{error}</span>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card className="mb-6">
                <CardHeader>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle>Filters & Search</CardTitle>
                            <CardDescription>
                                Filter agents by status, group, or search by name
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <FilterIcon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                {filteredAgents.length} of {agents.length} agents
                            </span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search agents by name, email, or ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <AgentFilters onFilterChange={handleFilterChange} />
                    </div>
                </CardContent>
            </Card>

            {loading && agents.length === 0 ? (
                <Card>
                    <CardContent className="flex justify-center items-center py-12">
                        <div className="flex items-center gap-2">
                            <Loader2Icon className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-muted-foreground">Loading agents...</span>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {filteredAgents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {filteredAgents.map(agent => (
                                <AgentCard
                                    key={agent.id}
                                    agent={agent}
                                    onStatusChange={handleStatusChange}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    ) : (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                <UsersIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No agents found</h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchTerm || filters.status || filters.groupId
                                        ? "Try adjusting your search or filters"
                                        : "Get started by adding your first agent"
                                    }
                                </p>
                                <Button onClick={() => setShowCreateModal(true)}>
                                    <PlusIcon className="h-4 w-4 mr-2" />
                                    Add New Agent
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}

            <CreateAgentModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onSubmit={handleCreateAgent}
            />
        </div>
    );
};