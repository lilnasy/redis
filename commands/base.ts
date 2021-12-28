import {
	decodeRESP,
	encodeRESP,
	RedisRequest,
	RedisResponse,
	RESP
} from '../protocol.ts'

export default class {

	connection: Deno.Conn

	running: Promise<RedisResponse>

	constructor(connection: Deno.Conn) {
		this.connection = connection
		this.running = Promise.resolve(null)
	}

	async RawSingleCommand(singleCommand: RedisRequest) {
		
		const resp = encodeRESP(singleCommand)

		const command = this.SendRawRESP(resp)

		this.running = command

		const response = await command.then(messages => messages[0])

		return response
	}

	async RawPipeline(...commands: Array<RedisRequest>) {
		
		if (commands.length < 1)
			return Promise.reject('No commands provided for Redis Pipeline')

		const resp = commands.map(encodeRESP).join('')

		const pipeline = this.SendRawRESP(resp)

		this.running = pipeline

		const response = await pipeline

		return response
	}

	/* Unreliable
	async function Transact(...commands: Array<RedisRequest>) {

		if (commands.length < 1) return Promise.reject('No commands provided for Redis Transaction')

		const resp = 'MULTI\r\n' + commands.map(encodeRESP).join('') + 'EXEC\r\n'

		const transaction = Send(resp)

		running = transaction

		const response = await transaction.then( x => x.slice(-1).flat() )

		return response
	}
	*/

	private async SendRawRESP(respReq: RESP) {
		// instead of using a queue, Send waits for the promise of the running command to settle
		await this.running

		// bytearray gets mutated by Deno.conn.write
		const bytearray = new TextEncoder().encode(respReq)
		await this.connection.write(bytearray)

		// chunk gets mutated by Deno.conn.read
		const chunk = new Uint8Array(1024)
		await this.connection.read(chunk)

		const respRes = new TextDecoder().decode(chunk)
		const response = decodeRESP(respRes)

		return response
	}
}