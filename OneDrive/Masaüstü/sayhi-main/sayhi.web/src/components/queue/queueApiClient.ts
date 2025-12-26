import { ApiClient } from "../../lib/apiClient"
import { QueueType, type Queue } from "../../lib/Models"

class QueueApiClient extends ApiClient<Queue>
{
    //constructor(baseUrl: string = "/api/queues")
    constructor()
    {
        super();
        //this.baseUrl = baseUrl;
        this.baseUrl = "/api/queues";
    }

    async get(id: string): Promise<Queue>
    {
        const defaultValue: Queue = {
            id: "",
            name: "",
            type: QueueType.None,
            isActive: false,
            createdAt: ""
        } as Queue;
        return super.get(id, defaultValue);
    }
}

const apiClient = new QueueApiClient();

export default apiClient;
