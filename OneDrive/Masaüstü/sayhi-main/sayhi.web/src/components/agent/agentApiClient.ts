import { ApiClient } from "../../lib/apiClient"
import { type Agent } from "../../lib/Models"

class AgentApiClient extends ApiClient<Agent>
{
    //constructor(baseUrl: string = "/api/queues")
    constructor()
    {
        super();
        //this.baseUrl = baseUrl;
        this.baseUrl = "/api/agents";
    }

    /*
    async get(id: string): Promise<Agent>
    {
        const defaultValue: Agent = {
            id: "",
            name: "",
            type: QueueType.None,
            isActive: false,
            createdAt: ""
        } as Agent;
        return super.get(id, defaultValue);
    }
    */
}

const apiClient = new AgentApiClient();

export default apiClient;
