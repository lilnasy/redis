// CRLF delimited text
export type RESP = string

// array of strings
export type RedisRequest = Array<string>

export type RedisResponse =
	| Array<RedisResponse>
	| Error	
	| string
	| BigInt
	| null
	| number
	| boolean
	| BigNumber
	| Map<RedisResponse, RedisResponse>

class BigNumber {
	value: string
	constructor(bignumber: string) {
		this.value = bignumber
	}
}

/** translates commands to redis protocol 2 for sending to the redis connection
 * https://web.archive.org/web/20211127173832/https://redis.io/topics/protocol
 * @param blobstrings array of strings for a single command
 */
export function encodeRESP(blobstrings: RedisRequest): RESP {
	
	const main = blobstrings
		.flatMap( blob => ['$' + blob.length, blob])
		.join('\r\n')
	
	return '*' + blobstrings.length + '\r\n' + main + '\r\n'
}

/** translates redis protocol to an array of messages
 * each message usually contains response to one command
 * @param resp string encoded in resp
 */
export function decodeRESP(resp: RESP, acc: Array<RedisResponse> = []): Array<RedisResponse> {
	
	if (resp === '') return acc

	// recursive implementation of the Redis Protocol RESP 3
	switch (resp[0]) {

		// Array: an ordered collection of other types
		case '*': {
			
			const arrayLength = Number(resp.substring(1, resp.indexOf('\r\n')))
			
			const rest = resp.substring(resp.indexOf('\r\n') + 2)
			
			const restDecoded = decodeRESP(rest)
			
			return [
				...acc,
				restDecoded.slice(0, arrayLength),
				...restDecoded.slice(arrayLength)
			]
		}
		
		// Verbatim string: a binary safe string that should be displayed
		// to humans without any escaping or filtering. For instance the
		// output of LATENCY DOCTOR in Redis.
		case '=':
		case '$': {
			
			const verbatimStringLength = parseInt(resp.substring(1, resp.indexOf('\r\n')))
			
			const rest = resp.substring(resp.indexOf('\r\n') + 2)
			
			const verbatimString = rest.substring(0, verbatimStringLength)
			
			const restrest = rest.substring(verbatimStringLength + 2)
			
			return decodeRESP(restrest, [...acc, verbatimString])
		}

		// simple string: a space efficient non binary safe string
		case '+': {
			
			const simpleString = resp.substring(1, resp.indexOf('\r\n'))
			
			const rest = resp.substring(resp.indexOf('\r\n') + 2)
			
			return decodeRESP(rest, [...acc, simpleString])
		}

		// Simple error: a space efficient non binary safe error code and message
		case '-': {
			
			const simpleError = new Error(resp.substring(1, resp.indexOf('\r\n')))
			
			const rest = resp.substring(resp.indexOf('\r\n') + 2)

			return decodeRESP(rest, [...acc, simpleError])
		}

		// Number: an integer in the signed 64 bit range
		case ':': {
			
			const value = resp.substring(1, resp.indexOf('\r\n'))
			
			const rest = resp.substring(resp.indexOf('\r\n') + 2)
			
			return decodeRESP(rest, [...acc, BigInt(value)])
		}

		// Null: a single null value replacing RESP v2 *-1 and $-1 null values
		case '_': {

			const rest = resp.substring(resp.indexOf('\r\n') + 2)

			return decodeRESP(rest, [...acc, null])
		}

		// Double: a floating point number
		case ',': {

			const value = resp.substring(1, resp.indexOf('\r\n'))

			const double = Number(value) ||
				(value ===  'inf') ?  Infinity : NaN ||
				(value === '-inf') ? -Infinity : NaN

			const rest = resp.substring(resp.indexOf('\r\n') + 2)

			return decodeRESP(rest, [...acc, double])
		}

		// Boolean: true or false
		case '#': {

			const value = resp.substring(1, resp.indexOf('\r\n'))

			const rest = resp.substring(resp.indexOf('\r\n') + 2)

			return decodeRESP(rest, [...acc, value === 't'])
		}

		// Blob error: binary safe error code and message.
		case '!': {
			
			const blobErrorLength = parseInt(resp.substring(1, resp.indexOf('\r\n')))
			
			const rest = resp.substring(resp.indexOf('\r\n') + 2)
			
			const value = rest.substring(0, blobErrorLength)
			
			const restrest = rest.substring(blobErrorLength + 2)
			
			return decodeRESP(restrest, [...acc, new Error(value)])
		}

		// Big number: a large number non representable by the Number type
		case '(': {

			const value = resp.substring(1, resp.indexOf('\r\n'))

			const rest = resp.substring(resp.indexOf('\r\n') + 2)

			return decodeRESP(rest, [...acc, new BigNumber(value)])
		}

		// Map: an ordered collection of key-value pairs. Keys and values can be any other RESP3 type.
		case '%': {

			const mapLength = Number(resp.substring(1, resp.indexOf('\r\n')))
			
			const rest = resp.substring(resp.indexOf('\r\n') + 2)

			const restDecoded = decodeRESP(rest)

			type ReduceResult = [RedisResponse, RedisResponse][]
			const map = restDecoded
				.slice( 0, mapLength * 2 )
				.reduce(
					(accumulated: ReduceResult, _, ind, sourceArray) => {
						if (ind % 2 === 1) return accumulated
						return <ReduceResult> [ ...accumulated, [ sourceArray.at(ind), sourceArray.at(ind+1) ] ]
					}, []
				)

			return [
				...acc,
				new Map(map),
				...restDecoded.slice(mapLength * 2)
			]
		}

		default:
			throw new TypeError(`Couldn't decode redis protocol: Unknown type character ${resp[0]}`)
	}
}
