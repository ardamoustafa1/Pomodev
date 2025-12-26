import { ApiClient } from "../../lib/apiClient"
import { GroupType, type Group } from "../../lib/Models"

class GroupApiClient extends ApiClient<Group>
{
    constructor()
    {
        super();
        this.baseUrl = "/api/groups";
    }

    async get(id: string): Promise<Group>
    {
        const defaultValue: Group = {
            id: "",
            name: "",
            type: GroupType.None,
            isActive: false,
            createdAt: ""
        } as Group;
        return super.get(id, defaultValue);
    }
}

const apiClient = new GroupApiClient();

export default apiClient;
