import { config } from "../config.js";

export class RawgClient {
  private readonly baseUrl = config.rawgBaseUrl;
  private readonly apiKey = config.rawgApiKey;
  private readonly timeoutMs = config.fetchTimeoutMs;

  private buildUrl(endpoint: string, params: Record<string, unknown> = {}): string {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set("key", this.apiKey);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }

    return url.toString();
  }

  async get<T>(endpoint: string, params: Record<string, unknown> = {}): Promise<T> {
    const url = this.buildUrl(endpoint, params);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "RAWG-API/1.0",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        throw new RawgError(
          `RAWG API error ${response.status}: ${response.statusText}`,
          response.status,
          errorText.slice(0, 500),
        );
      }

      return response.json() as Promise<T>;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new RawgError(`RAWG API timeout after ${this.timeoutMs}ms`, 504, "");
      }
      throw err;
    } finally {
      clearTimeout(timer);
    }
  }
}

export class RawgError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: string,
  ) {
    super(message);
    this.name = "RawgError";
  }
}

export const rawg = new RawgClient();
