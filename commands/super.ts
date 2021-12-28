import Base from './base.ts'

import { auth } from './auth.ts'
import { get, set, setex} from './basic.ts'
import { hget, hset } from './hash.ts'
import { ratelimit } from './ratelimit.ts'
import {} from './sortedset.ts'

export default class extends Base {
	
	auth = auth
	
	get = get
	set = set
	setex = setex

	hget = hget
	hset = hset

	ratelimit = ratelimit
	
}
