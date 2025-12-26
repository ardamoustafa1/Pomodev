import { getWithAuth, postJson, postWithAuth, putWithAuth, deleteWithAuth } from "./httpClient"
import storage from "./storage"
import { type Chat, type ChatMessage, type ChatParticipant, type PaginatedResponse } from "./Models"

async function login(username: string, password: string): Promise<string | null>
{
    const json = await postJson("/api/Access/login", { username, password });

    if (json?.token == null)
    {
        storage.Token.delete();
        //storage.User.delete();
        return null;
    }

    storage.Token.set(json.token);
    storage.User.set(json.user);

    return json.token;
}

export const httpClients = {
    Access: {
        login: login
    },
    Chat: {
        getChats: async (): Promise<Chat[]> =>
        {
            const chats = await getWithAuth<Chat[]>("/api/Chat") ?? [];

            return chats.map(chat => ({
                ...chat,
                participantMap: new Map<string, ChatParticipant>(chat
                    .participants
                    .map(participant => [participant.id, participant]))
            }));
        },
        getMessages: async (chatId: string): Promise<ChatMessage[]> =>
        {
            return await getWithAuth<ChatMessage[]>(`/api/Chat/${chatId}/messages`) ?? [];
        }
    }
};

export class ApiClient<T extends { id: string; }>
{
    protected baseUrl: string = "/api";

    async getSome(page: number = 1, pageSize: number = 20, signal?: AbortSignal): Promise<PaginatedResponse<T>>
    {
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: pageSize.toString()
            //includeSkills: includeSkills.toString(),
            //...(groupId && { groupId }),
            //...(status !== undefined && { status: status.toString() })
        });

        return await getWithAuth<PaginatedResponse<T>>(`${this.baseUrl}?${params}`, undefined, signal)
            ?? { items: [], page, pageSize };
    }

    async get(id: string, defaultValue: T): Promise<T>
    {
        return await getWithAuth<T>(`${this.baseUrl}/${id}`) ?? { ...defaultValue } as T;
    }

    async create(request: Partial<T>): Promise<T>
    {
        return await postWithAuth<Partial<T>>(this.baseUrl, request);
    }

    async update(request: Partial<T>): Promise<T>
    {
        return await putWithAuth<Partial<T>>(`${this.baseUrl}/${request.id}`, request);
    }

    async delete(id: string): Promise<void>
    {
        await deleteWithAuth(`${this.baseUrl}/${id}`);
    }
}

/*
interface UseFetchResult<T> {
    data: T | null;
    loading: boolean;
    error: Error | null;
    refetch: () => void;
}

function useFetch<T>(url: string): UseFetchResult<T>
{
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    const fetchData = useCallback(async () =>
    {
        setLoading(true);
        setError(null);
        
        try
        {
            const response = await fetch(url);
            if (!response.ok) throw new Error("Network error");
            const json = await response.json();
            setData(json);
        }
        catch (err)
        {
            setError(err as Error);
        }
        finally
        {
            setLoading(false);
        }
    }, [url]);
    
    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    return { data, loading, error, refetch: fetchData };
}

// Kullanım
function UserList()
{
    const { data, loading, error, refetch } = useFetch<User[]>("/api/users");
    
    if (loading)
        return <div>Loading...</div>;
    if (error)
        return <div>Error: {error.message}</div>;
    
    return (
        <>
            <button onClick={refetch}>Refresh</button>
            <ul>
                {data?.map(user => <li key={user.id}>{user.name}</li>)}
            </ul>
        </>
    );
}
*/