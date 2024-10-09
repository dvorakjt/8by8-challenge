export interface RateLimiter {
  limit(identifier: string): Promise<{ success: boolean }>;
}
