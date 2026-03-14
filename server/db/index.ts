import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as linkCacheSchema from './schemas/linkCache'
import * as auditCacheSchema from './schemas/auditCache'
import * as commentCacheSchema from './schemas/commentCache'
import * as auditHistorySchema from './schemas/auditHistory'
import * as usersSchema from './schemas/users'
import * as linkedChannelsSchema from './schemas/linkedChannels'
import * as answeredCommentsSchema from './schemas/answeredComments'
import * as creatorSettingsSchema from './schemas/creatorSettings'

const schema = {
  ...linkCacheSchema,
  ...auditCacheSchema,
  ...commentCacheSchema,
  ...auditHistorySchema,
  ...usersSchema,
  ...linkedChannelsSchema,
  ...answeredCommentsSchema,
  ...creatorSettingsSchema
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

export const db = drizzle(pool, { schema })
