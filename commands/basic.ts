import Redis from './base.ts'

export async function set(this: Redis, key: string, value: string) {
	
	return await this.RawSingleCommand([
		'SET',
		key,
		value
	])
}

/** sets a temporary key value pair
 * @param key		: a name to uniquely identify the value
 * @param ttl		: time to live
 * @param value		: a text value
 */
export async function setex(this: Redis, key: string, ttl: number, value: string) {
	
	return await this.RawSingleCommand([
		'SETEX',
		key,
		String(ttl),
		value
	])
}

export async function get(this: Redis, key: string) {
	
	const response = await this.RawSingleCommand([
		'GET',
		key
	])

	if (typeof response !== 'string') throw new TypeError(
		'Redis replied with an unexpected type in response to a GET command',
		{ cause : new Map([[ ['HGET', key], response ]]) }
	)

	if (response) return response

	return undefined
}