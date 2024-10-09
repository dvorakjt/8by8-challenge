import { RateLimiter } from './rate-limiter';

export interface CreateRateLimiterParams {
  route: string;
  allowedRequests: number;
  duration: number;
  durationUnit: 'ms' | 's' | 'm' | 'h' | 'd';
}

export interface CreateRateLimiter {
  (params: CreateRateLimiterParams): RateLimiter;
}
