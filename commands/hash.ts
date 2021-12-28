import Redis from './base.ts'

export async function hset(
	this: Redis,
	key: string,
	field: string,
	value: string
) {	
	return await this.RawSingleCommand([
		'HSET',
		key,
		field,
		value
	])
}

export async function hget (this: Redis, key: string, field: string) {
	
	const response = await this.RawSingleCommand([
		'HGET',
		key,
		field
	])

	if (typeof response !== 'string')
		throw new TypeError(
			'Redis replied with an unexpected type in response to a HGET command',
			{ cause: new Map([[['HGET', key, field], response]]) }
		)

	if (response) return response

	return undefined
}