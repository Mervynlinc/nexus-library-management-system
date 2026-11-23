/**
 * Minimal API client for talking to the Express backend.
 *
 * Concept (Client-Server & HttpOnly Cookies):
 * Next.js runs on :3000 and Express runs on :4000. Setting `credentials: "include"`
 * tells the browser to send and store the HttpOnly `nexus_token` JWT cookie
 * across those two origins (paired with `cors({ credentials: true })` on Express).
 */

/**
 * Resolve the Express API base URL.
 *
 * 1. An explicit NEXT_PUBLIC_API_URL always wins (required in production).
 * 2. In the browser, mirror the page's hostname on port 4000, so visiting
 *    http://127.0.0.1:3000 talks to http://127.0.0.1:4000. Using the same
 *    hostname as the page keeps the HttpOnly auth cookie same-site.
 * 3. Fall back to localhost during server-side rendering, where `window`
 *    does not exist.
 */
function resolveApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    return "";
  }

  return "";
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${resolveApiBase()}${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Express returns `{ error: { code, message } }` consistently on failures.
    const message = data?.error?.message || `Request failed (${res.status})`;
    if (res.status === 401 && !path.startsWith("/api/auth/") && typeof window !== "undefined") window.location.replace("/login");
    throw new ApiError(message, res.status);
  }

  if (data === null) throw new Error("The API returned an invalid response. Check that the API server is running.");
  return data as T;
}

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

