export interface RateLimiter {
  consumePoint(indentifier: string): Promise<number>;
  getRemainingPoints(identifier: string): Promise<number>;
}
