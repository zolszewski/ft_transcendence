export async function apiFetch(
    path: string,
    options: RequestInit = {}
) {
    const headers = new Headers(options.headers);

    if (!(options.body instanceof FormData)) {
        headers.set("Content-Type", "application/json");
    }

    return fetch(`/api${path}`, {
        ...options,
        credentials: "include",
        headers,
    });
}