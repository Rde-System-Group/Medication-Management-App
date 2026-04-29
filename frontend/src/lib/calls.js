/** Mirrors backend cookie name; used as Bearer fallback when cookies are not sent (e.g. some cross-origin setups). */
export const AUTH_TOKEN_STORAGE_KEY = "RDE_BE_AUTH_TOKEN";
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "http://20.57.128.226:8500";

export async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    try {
        const token = sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
        if (token) headers.set("Authorization", `Bearer ${token}`);
    } catch {
        /* ignore storage errors */
    }
    return await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
    });
}