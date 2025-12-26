import storage from "./storage";

async function tryCatch<T>(action: () => Promise<T | null>, actionName?: string): Promise<T | null>
{
    try
    {
        return await action();
    }
    catch (error)
    {
        console.error(`Error in ${actionName}:`, error);
        return null;
    }
}

function navigateToLogin()
{
    if (window.location.pathname != "/login")
    {
        window.location.href = "/login";
    }
}

export async function sendJson<TBody = null, TResult = any>(method: string, url: string, needAuth: boolean, body?: TBody, headers?: HeadersInit, signal?: AbortSignal): Promise<TResult | null>
{
    return await tryCatch<TResult>(async () =>
    {
        let updatedHeaders = body ? { "Content-Type": "application/json", ...headers } : headers;

        if (needAuth)
        {
            let token: string | null = storage.Token.get();

            if (!token)
            {
                //token = await login("ozgur.civi@outlook.com", "1");
                //console.log(`token ${token}`);
                navigateToLogin();
                return null;
            }

            updatedHeaders = { Authorization: `Bearer ${token}`, ...updatedHeaders }
        }

        const response = await fetch(url, {
            method,
            headers: updatedHeaders,
            body: body ? JSON.stringify(body) : null,
            signal: signal ?? new AbortController().signal
        });

        if (response.ok)
            return await response.json() as TResult;

        if (response.status === 401)
        {
            navigateToLogin();
            return null;
        }

        throw new Error(`HTTP status: ${response.status} ${response.statusText}`);
    }, `${method} ${url}`);
}

export async function sendWithAuth<TBody = null, TResult = any>(method: string, url: string, body?: TBody, headers?: HeadersInit, signal?: AbortSignal): Promise<TResult | null>
{
    return await sendJson<TBody, TResult>(method, url, true, body, headers, signal);
}

export async function getJson<TResult = any>(url: string, headers?: HeadersInit, signal?: AbortSignal): Promise<TResult | null>
{
    return await sendJson<null, TResult>("GET", url, false, null, headers, signal);
}

export async function getWithAuth<TResult = any>(url: string, headers?: HeadersInit, signal?: AbortSignal): Promise<TResult | null>
{
    return await sendJson<null, TResult>("GET", url, true, null, headers, signal);
}

export async function postJson<TBody = null, TResult = any>(url: string, body?: TBody, headers?: HeadersInit, signal?: AbortSignal): Promise<TResult | null>
{
    return await sendJson<TBody, TResult>("POST", url, false, body, headers, signal);
}

export async function postWithAuth<TBody = null, TResult = any>(url: string, body?: TBody, headers?: HeadersInit, signal?: AbortSignal): Promise<TResult | null>
{
    return await sendJson<TBody, TResult>("POST", url, true, body, headers, signal);
}

export async function putJson<TBody = null, TResult = any>(url: string, body?: TBody, headers?: HeadersInit, signal?: AbortSignal): Promise<TResult | null>
{
    return await sendJson<TBody, TResult>("PUT", url, false, body, headers, signal);
}

export async function putWithAuth<TBody = null, TResult = any>(url: string, body?: TBody, headers?: HeadersInit, signal?: AbortSignal): Promise<TResult | null>
{
    return await sendJson<TBody, TResult>("PUT", url, true, body, headers, signal);
}

export async function deleteJson<TResult>(url: string, headers?: HeadersInit, signal?: AbortSignal): Promise<TResult | null>
{
    return await sendJson<null, TResult>("DELETE", url, false, null, headers, signal);
}

export async function deleteWithAuth<TResult>(url: string, headers?: HeadersInit, signal?: AbortSignal): Promise<TResult | null>
{
    return await sendJson<null, TResult>("DELETE", url, true, null, headers, signal);
}