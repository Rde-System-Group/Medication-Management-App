/** Mirrors backend cookie name; used as Bearer fallback when cookies are not sent (e.g. some cross-origin setups). */
export const AUTH_TOKEN_STORAGE_KEY = "RDE_BE_AUTH_TOKEN";
export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL ?? "http://20.57.128.226:8500";

export async function apiFetch(path, options = {}) {
    return await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        credentials: "include",
    });
}