import { redis } from './redis';

// Atomic "is auto-alloc running?" check + set (prevents race conditions)
// Returns true if lock was acquired, false otherwise
export async function acquireAutoAllocLock(teamId: string, userId: string): Promise<boolean> {
    const lockKey = `lock:team:${teamId}:autoalloc`;
    console.log(`[RedisLock] Attempting to acquire lock: ${lockKey} for user: ${userId}`);
    // 'EX', 30 sets expiration to 30 seconds
    // 'NX' only sets if key does not exist
    const result = await redis.set(lockKey, userId, 'EX', 30, 'NX');
    console.log(`[RedisLock] Result for ${lockKey}: ${result}`);
    return result === 'OK';
}


export async function releaseAutoAllocLock(teamId: string, userId: string) {
    const lockKey = `lock:team:${teamId}:autoalloc`;
    console.log(`[RedisLock] Attempting to release lock: ${lockKey} by user: ${userId}`);
    const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
    else
        return 0
    end
  `;
    const result = await redis.eval(script, 1, lockKey, userId);
    console.log(`[RedisLock] Release result for ${lockKey}: ${result}`);
}


// Get current runner (for toast messages)
export async function getAutoAllocRunner(teamId: string): Promise<string | null> {
    const lockKey = `lock:team:${teamId}:autoalloc`;
    return await redis.get(lockKey);
}
