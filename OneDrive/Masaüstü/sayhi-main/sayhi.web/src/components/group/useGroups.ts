import { useState, useEffect } from "react"
import { type Group } from "../../lib/Models"
import apiClient from "./groupApiClient"

//function useFetch<T>(dataAction: (signal: AbortSignal) => Promise<Response>, deps: any[] = [])
function useFetch<T>(dataAction: (signal: AbortSignal) => Promise<T>, deps: any[] = [])
{
    const [data, setData] = useState<T>([] as T);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const reload = async (cancellation: AbortController) =>
    {
        setLoading(true);
        setError(null);

        dataAction(cancellation.signal)
            /*
            .then(res =>
            {
                if (!res.ok)
                    throw new Error("Fetch hatası");
                return res.json();
            })
            .then((json: T) =>
            */
            .then(res =>
            {
                setData(res);
                setLoading(false);
            })
            .catch(err =>
            {
                if (err.name === "AbortError")
                    return;

                setError(err.message);
                setLoading(false);
            });

        return () => cancellation.abort();
    };

    /*
    const create = async (request: CreateGroupRequest): Promise<boolean> =>
    {
        try
        {
            await apiClient.create(request);
            await reload();
            return true;
        }
        catch (err)
        {
            setError(err instanceof Error ? err.message : "Failed to create");
            return false;
        }
    };

     const update = async (id: string, request: CreateGroupRequest): Promise<boolean> =>
    {
        try
        {
            await apiClient.update(id, request);
            setData(prev => prev.map(item => item.id === id ? { ...item, request } : item ));
            return true;
        }
        catch (err)
        {
            setError(err instanceof Error ? err.message : "Failed to update");
            return false;
        }
    };

    const remove = async (id: string): Promise<boolean> =>
    {
        try
        {
            await apiClient.delete(id);
            setData(prev => prev.filter(item => item.id !== id));
            return true;
        }
        catch (err)
        {
            setError(err instanceof Error ? err.message : "Failed to delete");
            return false;
        }
    };
    */

    useEffect(() =>
    {
        const cancellation = new AbortController();

        reload(cancellation);

        return () => cancellation.abort();
    }, deps);

    return { data, setData, loading, error, reload };
}

export const useGroups = () =>
{
    const { data, setData, loading, error, reload } =
        //useFetch<{ id: number; name: string; email: string; }[]>((signal) =>
        useFetch<Group[]>(async (signal) =>
            //fetch("https://jsonplaceholder.typicode.com/users", { signal }),
            {
                const result = await apiClient.getSome(1, 20, signal);
                return result.items;
            },
            []);

    return {
        groups: data,
        setGroups: setData,
        loading,
        error,
        reload/*,
        create,
        update,
        remove*/
    };
};