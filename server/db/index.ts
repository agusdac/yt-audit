import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as linkCacheSchema from './schemas/linkCache'
import * as auditHistorySchema from './schemas/auditHistory'

const schema = {
  ...linkCacheSchema,
  ...auditHistorySchema
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})

export const db = drizzle(pool, { schema })
