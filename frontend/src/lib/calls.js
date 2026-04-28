/** Mirrors backend cookie name; used as Bearer fallback when cookies are not sent (e.g. some cross-origin setups). */
export const AUTH_TOKEN_STORAGE_KEY = "RDE_BE_AUTH_TOKEN";

export async function apiFetch(url, options = {}) {
    const headers = new Headers(options.headers || {});
    try {
        const t = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
        if (t) headers.set("Authorization", `Bearer ${t}`);
    } catch {
        /* ignore */
    }
    return fetch(url, {
        ...options,
        headers,
        credentials: "include",
    });
}