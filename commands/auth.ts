import Redis from './base.ts'

export async function auth(this: Redis, password: string) {
	
	return await this.RawSingleCommand([
		'AUTH',
		password
	])
}