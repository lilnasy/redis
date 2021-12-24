export  { type RESP
        , type RedisRequest
        , type RedisResponse
        , encodeRESP
        , decodeRESP }

// CRLF delimited text
type RESP = string

// array of bulkstrings
type RedisRequest = Array<string>

type RedisResponse = string | number | null | Array<RedisResponse>


/** translates commands to redis protocol 2 for sending to the redis connection
 * https://web.archive.org/web/20211127173832/https://redis.io/topics/protocol
 * @param bulkstrings array of strings for a single command
*/
function encodeRESP(bulkstrings: RedisRequest): RESP {
	const main = bulkstrings.flatMap( bulk => ['$' + bulk.length, bulk] ).join('\r\n')
	return '*' + bulkstrings.length + '\r\n' + main + '\r\n'
}

/** translates redis protocol to an array of messages
 * each message usually contains response to one command
 * @param resp string encoded in resp
 */
function decodeRESP(resp: RESP): Array<RedisResponse> {
	// recursive implementation of the Redis Protocol RESP2
	// not tail-recursive because priorities
	switch ( resp[0] ) {

		case '-':
		case '+': {
			const simpleString	= resp.substring( 1, resp.indexOf('\r\n') )
			const rest		= resp.substring( resp.indexOf('\r\n') + 2 )
			return [ simpleString , ...decodeRESP(rest) ] }

		case ':': {
			const integer		= Number( resp.substring( 1, resp.indexOf('\r\n') ) )
			const rest		= resp.substring( resp.indexOf('\r\n') + 2 )
			return [ integer, ...decodeRESP(rest) ] }

		case '$': {
			const _bulkStringLength	= resp.substring( 1, resp.indexOf('\r\n') )
			const rest		= resp.substring( resp.indexOf('\r\n') + 2 )
			const bulkString	= rest.substring( 0, rest.indexOf('\r\n') )
			const restrest		= rest.substring( rest.indexOf('\r\n') + 2 )
			return [ bulkString , ...decodeRESP(restrest) ] }

		case '*': {
			const arrayLength	= Number( resp.substring( 1, resp.indexOf('\r\n') ) )
			const rest		= resp.substring( resp.indexOf('\r\n') + 2 )
			const restDecoded	= decodeRESP(rest)
			if (arrayLength === -1)	return [ null, ...restDecoded ]
			if (arrayLength === 0)	return [ [], ...restDecoded ]
			return [ restDecoded.slice( 0, arrayLength ), ...restDecoded.slice( arrayLength ) ] }

		default	: return []
	}
}
