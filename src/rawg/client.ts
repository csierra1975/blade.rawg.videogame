import { config } from "../config.js";

export class RawgClient {
  private readonly baseUrl = config.rawgBaseUrl;
  private readonly apiKey = config.rawgApiKey;

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

    const response = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "RAWG-API/1.0",
      },
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new RawgError(
        `RAWG API error ${response.status}: ${response.statusText}`,
        response.status,
        errorText,
      );
    }

    return response.json() as Promise<T>;
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
