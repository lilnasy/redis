export	{ auth
	, expire
	, get
	, hset
	, hget
	, set
	, setex
	, zadd
	, zcount
	, zremrangebyscore }

function auth(password: string) {
	return ["AUTH", password]
}

function expire(
	key: string,
	seconds: number ) {
	
	return ["EXPIRE", key, String(seconds)]
}

function get(key: string) {
	return ["GET", key]
}

function hset(
	key: string,
	field: string,
	value: string ) {
	
	return ["HSET", key, field, value]
}

function hget(
	key: string,
	field: string ) {
	
	return ["HGET", key, field]
}

function set(
	key: string,
	value: string ) {
	
	return ["SET", key, value]
}

function setex(
	key: string,
	ttl: number,
	value: string ) {
	
	return ["SETEX", key, String(ttl), value]
}

function zadd(
	nameOfSet: string,
	score: number,
	nameOfMember: string ) {
	
	return ["ZADD", nameOfSet, String(score), nameOfMember]
}

function zcount(
	nameOfSet: string,
	startOfRange: number,
	endOfRange: number ) {
	
	return ["ZCOUNT", nameOfSet, String(startOfRange), String(endOfRange)]
}

function zremrangebyscore(
	nameOfSet: string,
	startOfRange: number,
	endOfRange: number ) {
	
	return ["ZREMRANGEBYSCORE", nameOfSet, String(startOfRange), String(endOfRange)]
}
