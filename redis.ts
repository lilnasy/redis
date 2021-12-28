import {
	decodeRESP,
	encodeRESP,
	RedisRequest,
	RedisResponse,
	RESP
} from './protocol.ts'

import {
	auth,
	expire,
	get,
	hget,
	hset,
	set,
	setex,
	zadd,
	zcount,
	zremrangebyscore
} from './commands.ts'

type ConnectOptions = {
	hostname?: string
	port?: number | string
	username?: string
	password?: string
}

/** creates a connection to a redis instance,
 * ```ts
 * const redis = await connect({hostname: 'localhost', port: 6379})
 * redis.get('x')
 * ```
 */
export async function connect(options: ConnectOptions) {
	const connection = await Deno.connect({
		hostname: options.hostname || 'localhost',
		port: Number(options.port) || 6379,
	})

	let running: Promise<RedisResponse>

	if (options.password) {
		Command(auth(options.password))
	}

	return {
		set: async (key: string, value: string) => {
			return await Command(set(key, value))
		},

		/** sets a temporary key value pair
		 * @param key		: a name to uniquely identify the value
		 * @param ttl		: time to live
		 * @param value		: a text value
		 */
		setex: async (key: string, ttl: number, value: string) => {
			return await Command(setex(key, ttl, value))
		},

		get: async (key: string) => {
			const response = await Command(get(key))

			if (response && typeof response == 'string') return response

			return undefined
		},

		hset: async (key: string, field: string, value: string) => {
			return await Command(hset(key, field, value))
		},

		hget: async (key: string, field: string) => {
			const response = await Command(hget(key, field))

			if (response && typeof response == 'string') return response

			return undefined
		},

		/** rolling rate limit based on a strategy discussed in a 2015 ClassDojo blog post
		 * https://web.archive.org/web/20201130024240/https://engineering.classdojo.com/blog/2015/02/06/rolling-rate-limiter/
		 *
		 * ```ts
		 * const hourlyrate = await RateLimit( 3600, 'ratelimit:hourly:xyz' )
		 * if (hourlyrate > 10) return "Please try again later"
		 * ```
		 *
		 * adds to a sorted set everytime the command is executed, returns the current length of the set
		 * @param seconds	: the time period to consider when counting the rate
		 * @param key		: a name to uniquely identify the rate limit
		 */
		ratelimit: async (seconds: number, key: string) => {
			const remove = zremrangebyscore(
				'RateLimit:' + key,
				0,
				Date.now() - seconds * 1000,
			)
			const add = zadd('RateLimit:' + key, Date.now(), crypto.randomUUID())
			const count = zcount('RateLimit:' + key, 0, Infinity)
			const exp = expire('RateLimit:' + key, seconds)

			const [_removedCount, _addedCount, currentCount, _expStatus] =
				await Pipeline(remove, add, count, exp)

			return currentCount
		},
	}

	async function Command(singleCommand: RedisRequest) {
		const resp = encodeRESP(singleCommand)

		const command = Send(resp)

		running = command

		const response = await command.then((messages) => messages[0])

		return response
	}

	async function Pipeline(...commands: Array<RedisRequest>) {
		if (commands.length < 1) {
			return Promise.reject('No commands provided for Redis Pipeline')
		}

		const resp = commands.map(encodeRESP).join('')

		const pipeline = Send(resp)

		running = pipeline

		const response = await pipeline

		return response
	}

	/* Unreliable
	async function Transact (...commands: Array<RedisRequest>) {

		if (commands.length < 1) return Promise.reject('No commands provided for Redis Transaction')

		const resp = 'MULTI\r\n' + commands.map(encodeRESP).join('') + 'EXEC\r\n'

		const transaction = Send(resp)

		running = transaction

		const response = await transaction.then( x => x.slice(-1).flat() )

		return response
	}
	*/

	async function Send(respReq: RESP) {
		// instead of using a queue, Send waits for the promise of the running command to settle
		await running

		// bytearray gets mutated by Deno.conn.write
		const bytearray = new TextEncoder().encode(respReq)
		await connection.write(bytearray)

		// chunk gets mutated by Deno.conn.read
		const chunk = new Uint8Array(1024)
		await connection.read(chunk)

		const respRes = new TextDecoder().decode(chunk)
		const response = decodeRESP(respRes)

		return response
	}
}
