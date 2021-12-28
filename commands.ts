export function auth(
	password: string
) {
	return [
		'AUTH',
		password
	]
}

export function expire(
	key: string,
	seconds: number
) {
	return [
		'EXPIRE',
		key,
		String(seconds)
	]
}

export function get(
	key: string
) {
	return [
		'GET',
		key
	]
}

export function hset(
	key: string,
	field: string,
	value: string
) {
	return [
		'HSET',
		key,
		field,
		value
	]
}

export function hget(
	key: string,
	field: string
) {
	return [
		'HGET',
		key,
		field
	]
}

export function set(
	key: string,
	value: string
) {
	return [
		'SET',
		key,
		value
	]
}

export function setex(
	key: string,
	ttl: number,
	value: string
) {
	return [
		'SETEX',
		key,
		String(ttl),
		value
	]
}

export function zadd(
	nameOfSet: string,
	score: number,
	nameOfMember: string
) {
	return [
		'ZADD',
		nameOfSet,
		String(score),
		nameOfMember
	]
}

export function zcount(
	nameOfSet: string,
	startOfRange: number,
	endOfRange: number
) {
	return [
		'ZCOUNT',
		nameOfSet,
		String(startOfRange),
		String(endOfRange)
	]
}

export function zremrangebyscore(
	nameOfSet: string,
	startOfRange: number,
	endOfRange: number
) {
	return [
		'ZREMRANGEBYSCORE',
		nameOfSet,
		String(startOfRange),
		String(endOfRange),
	]
}
