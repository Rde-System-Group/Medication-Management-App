/** Mirrors backend cookie name; used as Bearer fallback when cookies are not sent (e.g. some cross-origin setups). */
export const AUTH_TOKEN_STORAGE_KEY = "RDE_BE_AUTH_TOKEN";
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "";

export async function apiFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    return await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: "include",
    });
}