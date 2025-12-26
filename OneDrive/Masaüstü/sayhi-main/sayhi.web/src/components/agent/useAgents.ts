import { useState, useEffect } from "react"
import { type Agent, type AgentDetail, type CreateAgentRequest, type AddAgentSkillRequest, type AgentStatus } from "../../lib/Models"
import apiClient from "./apiClient"

export const useAgents = () =>
{
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadAgents = async (page: number = 1, groupId?: string, status?: AgentStatus) =>
    {
        setLoading(true);
        setError(null);
        try
        {
            const includeSkills: boolean = false;
            const response = await apiClient.getSome(page, 20, includeSkills, groupId, status);

            setAgents(response.items);
        }
        catch (err)
        {
            setError(err instanceof Error ? err.message : "Failed to load agents");
        }
        finally
        {
            setLoading(false);
        }
    };

    const createAgent = async (request: CreateAgentRequest): Promise<boolean> =>
    {
        try
        {
            await apiClient.create(request);
            await loadAgents();
            return true;
        }
        catch (err)
        {
            setError(err instanceof Error ? err.message : "Failed to create agent");
            return false;
        }
    };

    const updateAgentStatus = async (id: string, status: AgentStatus): Promise<boolean> =>
    {
        try
        {
            await apiClient.setStatus(id, status);
            setAgents(prev => prev.map(agent =>
                agent.id === id ? { ...agent, status } : agent
            ));
            return true;
        }
        catch (err)
        {
            setError(err instanceof Error ? err.message : "Failed to update agent status");
            return false;
        }
    };

    const deleteAgent = async (id: string): Promise<boolean> =>
    {
        try
        {
            await apiClient.delete(id);
            setAgents(prev => prev.filter(agent => agent.id !== id));
            return true;
        }
        catch (err)
        {
            setError(err instanceof Error ? err.message : "Failed to delete agent");
            return false;
        }
    };

    useEffect(() =>
    {
        loadAgents();
    }, []);

    return {
        agents,
        setAgents,
        loading,
        error,
        loadAgents,
        createAgent,
        updateAgentStatus,
        deleteAgent
    };
};

export const useAgent = (id: string) =>
{
    const [agent, setAgent] = useState<AgentDetail | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadAgent = async () =>
    {
        if (!id)
            return;

        setLoading(true);
        setError(null);
        try
        {
            const agentData = await apiClient.get(id);
            setAgent(agentData);
        }
        catch (err)
        {
            setError(err instanceof Error ? err.message : "Failed to load agent");
        }
        finally
        {
            setLoading(false);
        }
    };

    const addSkill = async (request: AddAgentSkillRequest): Promise<boolean> =>
    {
        try
        {
            await apiClient.setSkill(id, request);
            await loadAgent(); // Reload agent data
            return true;
        }
        catch (err)
        {
            setError(err instanceof Error ? err.message : "Failed to add skill");
            return false;
        }
    };

    const removeSkill = async (skillId: string): Promise<boolean> =>
    {
        try
        {
            await apiClient.removeSkill(id, skillId);
            await loadAgent(); // Reload agent data
            return true;
        }
        catch (err)
        {
            setError(err instanceof Error ? err.message : "Failed to remove skill");
            return false;
        }
    };

    useEffect(() =>
    {
        loadAgent();
    }, [id]);

    return {
        agent,
        loading,
        error,
        loadAgent,
        addSkill,
        removeSkill
    };
};