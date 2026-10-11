export function allowInquiry(key: string, now?: number): boolean;
export function handleContact(request: Request, env: Record<string, string | undefined>, send?: typeof fetch, allow?: (key: string) => boolean): Promise<Response>;
