type ConnectOptions = Partial<URL>

import Redis from './commands/super.ts'

/** creates a connection to a redis instance,
 * ```ts
 * const redis = await connect({hostname: 'localhost', port: 6379})
 * redis.get('x')
 * ```
 */
export async function connect(options: ConnectOptions) {

	const { hostname, port, username, password } = options

	const connection = await Deno.connect({
		hostname: hostname || 'localhost',
		//@ts-ignore: parseInt(undefined) evaluates to NaN
		port: parseInt(port) || 6379
	})
	
	const redis = new Redis(connection)

	if (password) await redis.auth(password)

	return redis
}
