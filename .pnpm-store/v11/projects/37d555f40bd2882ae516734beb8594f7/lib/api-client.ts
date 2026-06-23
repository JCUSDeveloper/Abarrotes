export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`/api/backend/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") ?? "";
  const result = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof result === "object" && result && "message" in result
      ? Array.isArray(result.message)
        ? result.message.join(". ")
        : String(result.message)
      : "La operación no pudo completarse.";
    throw new ApiError(message, response.status, result);
  }

  return result as T;
}
