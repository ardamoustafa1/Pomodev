import { getWithAuth, postWithAuth, putWithAuth, deleteWithAuth, sendWithAuth } from "../../lib/httpClient"
import
{
    AgentStatus,
    type Agent, type AgentDetail, type CreateAgentRequest, type UpdateAgentRequest,
    type AddAgentSkillRequest, type PaginatedResponse, type AgentSkill
} from "../../lib/Models"

const apiClient = {
    getSome: async (page: number = 1, pageSize: number = 20, includeSkills: boolean = false, groupId?: string, status?: AgentStatus): Promise<PaginatedResponse<Agent>> =>
    {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString(),
            includeSkills: includeSkills.toString(),
            ...(groupId && { groupId }),
            ...(status !== undefined && { status: status.toString() })
        });

        //return await getWithAuth<PaginatedResponse<Agent>>(`/api/agents?${params}`) ?? { items: [], total: 0, page: 1, pageSize: 20 };
        return await getWithAuth<PaginatedResponse<Agent>>(`/api/agents?${params}`) ?? { items: [], page: 1, pageSize: 20 };
        /*
            '/api/Agents?GroupId=3fa85f64-5717-4562-b3fc-2c963f66afa6&Status=1&IncludeSkills=true&Page=1&PageSize=10' \
        */
    },
    get: async (id: string): Promise<AgentDetail> =>
    {
        return await getWithAuth<AgentDetail>(`/api/agents/${id}`) ?? {
            id: "",
            //employeeId: undefined,
            status: AgentStatus.Away,
            //tatus: "Away",
            personId: "",
            //avatarUrl: undefined,
            //groupId: undefined,
            createdAt: "",
            //lastActivityAt: undefined,
            name: "",
            email: "",
            //phoneNumber: undefined,
            //groupName: undefined,
            skillCount: 0,
            activeQueueCount: 0,
            skills: [],
            queueAssignments: []
        };
    },
    create: async (request: CreateAgentRequest): Promise<Agent> =>
    {
        return await postWithAuth<CreateAgentRequest>("/api/agents", request);
        //return await postWithAuth<CreateAgentRequest, Agent>("/api/agents", request) ?? {};
        //return await sendWithAuth<CreateAgentRequest>("POST", "/api/agents", request);
        //return await sendWithAuth<CreateAgentRequest, Agent>("POST", "/api/agents", request) ?? {};
    },
    update: async (id: string, request: UpdateAgentRequest): Promise<Agent> =>
    {
        return await putWithAuth<UpdateAgentRequest>(`/api/agents/${id}`, request);
    },
    delete: async (id: string): Promise<void> =>
    {
        await deleteWithAuth(`/api/agents/${id}`);
        //await deleteWithAuth<boolean>(`/api/agents/${id}`);
        //const success = await deleteWithAuth<boolean>(`/api/agents/${id}`);
    },
    setStatus: async (id: string, status: AgentStatus): Promise<void> =>
    {
        await sendWithAuth<AgentStatus>("PATCH", `/api/agents/${id}/status`, status);
    },
    getSkills: async (agentId: string): Promise<AgentSkill[]> =>
    {
        return await getWithAuth<AgentSkill[]>(`/api/agents/${agentId}/skills`) ?? [];
        //return await sendWithAuth<null, AgentSkill[]>("GET", `/api/agents/${agentId}/skills`) ?? [];
    },
    setSkill: async (agentId: string, request: AddAgentSkillRequest): Promise<void> =>
    {
        await postWithAuth(`/api/agents/${agentId}/skills`, request);
    },
    removeSkill: async (agentId: string, skillId: string): Promise<void> =>
    {
        await deleteWithAuth(`/api/agents/${agentId}/skills/${skillId}`);
    }
};

export default apiClient;