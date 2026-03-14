import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as linkCacheSchema from './schemas/linkCache'
import * as auditCacheSchema from './schemas/auditCache'
import * as auditHistorySchema from './schemas/auditHistory'
import * as usersSchema from './schemas/users'
import * as linkedChannelsSchema from './schemas/linkedChannels'

const schema = {
  ...linkCacheSchema,
  ...auditCacheSchema,
  ...auditHistorySchema,
  ...usersSchema,
  ...linkedChannelsSchema
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

export const db = drizzle(pool, { schema })
