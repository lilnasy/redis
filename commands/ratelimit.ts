import Redis from './base.ts'

/** rolling rate limit based on a strategy discussed in a 2015 ClassDojo blog post
 * https://web.archive.org/web/20201130024240/https://engineering.classdojo.com/blog/2015/02/06/rolling-rate-limiter/
 *
 * ```ts
 * const hourlyrate = await Redis.ratelimit( 'ratelimit:hourly:xyz', 3600 )
 * if (hourlyrate > 10) return "Please try again later"
 * ```
 *
 * adds to a sorted set everytime the command is executed, returns the current length of the set
 * @param key		a name to uniquely identify the rate limit
 * @param seconds	the time period in seconds to consider when counting the rate
 */
export async function ratelimit(this: Redis, key: string, seconds: number) {
	
	const remove = [
		'ZREMRANGEBYSCORE',
		'RateLimit:' + key,
		String(0),
		String(Date.now() - seconds * 1000)
	]
	
	const add = [
		'ZADD',
		'RateLimit:' + key,
		String(Date.now()),
		crypto.randomUUID()
	]

	const count = [
		'ZCOUNT',
		'RateLimit:' + key,
		String(0),
		'Inf'
	]

	const exp = [
		'EXPIRE',
		'RateLimit:' + key,
		String(seconds)
	]

	const [_removedCount, _addedCount, currentCount, _expStatus] = await this
		.RawPipeline(remove, add, count, exp)

	return currentCount
}
