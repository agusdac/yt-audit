import { eq, sql } from 'drizzle-orm'
import { db } from '~~/server/db'
import { users } from '~~/server/db/schemas/users'
import { linkedChannels } from '~~/server/db/schemas/linkedChannels'

export interface GoogleUser {
  sub: string
  email?: string
  name?: string
  picture?: string
}

export interface YouTubeChannel {
  id: string
  snippet: { title: string; customUrl?: string }
}

export async function getOrCreateUser(
  googleUser: GoogleUser,
  tokens: { access_token: string; refresh_token?: string }
) {
  const existing = await db.query.users.findFirst({
    where: eq(users.googleId, googleUser.sub)
  })

  const now = new Date()
  const userData = {
    googleId: googleUser.sub,
    email: googleUser.email ?? '',
    name: googleUser.name ?? null,
    avatarUrl: googleUser.picture ?? null,
    refreshToken: tokens.refresh_token ?? existing?.refreshToken ?? null,
    updatedAt: now
  }

  if (existing) {
    await db
      .update(users)
      .set({ ...userData, updatedAt: now })
      .where(eq(users.id, existing.id))
    return existing.id
  }

  const [inserted] = await db
    .insert(users)
    .values({
      googleId: googleUser.sub,
      email: googleUser.email ?? '',
      name: googleUser.name ?? null,
      avatarUrl: googleUser.picture ?? null,
      refreshToken: tokens.refresh_token ?? null
    })
    .returning({ id: users.id })
  return inserted!.id
}

export async function getUserById(userId: string) {
  return db.query.users.findFirst({
    where: eq(users.id, userId)
  })
}

export async function getLinkedChannels(userId: string) {
  return db.query.linkedChannels.findMany({
    where: eq(linkedChannels.userId, userId)
  })
}

export async function syncLinkedChannels(userId: string, channels: Array<{ channelId: string; handle: string; channelTitle?: string }>) {
  const existing = await getLinkedChannels(userId)
  const existingIds = new Set(existing.map(c => c.channelId))

  for (const ch of channels) {
    if (existingIds.has(ch.channelId)) continue
    await db.insert(linkedChannels).values({
      userId,
      channelId: ch.channelId,
      handle: ch.handle,
      channelTitle: ch.channelTitle ?? null
    })
  }
}

export async function findUserByHandle(handle: string): Promise<string | null> {
  const normalized = handle.trim().replace(/^@/, '').toLowerCase()
  const rows = await db
    .select({ userId: linkedChannels.userId })
    .from(linkedChannels)
    .where(sql`lower(${linkedChannels.handle}) = ${normalized}`)
    .limit(1)
  return rows[0]?.userId ?? null
}

export async function getOrCreateImpersonationUser(
  channelInfo: { channelId: string; handle: string; channelTitle: string }
): Promise<string> {
  const existing = await findUserByHandle(channelInfo.handle)
  if (existing) return existing

  const googleId = `impersonate-${channelInfo.channelId}`
  const existingImpersonation = await db.query.users.findFirst({
    where: eq(users.googleId, googleId),
    columns: { id: true }
  })
  if (existingImpersonation) {
    await syncLinkedChannels(existingImpersonation.id, [channelInfo])
    return existingImpersonation.id
  }

  const [inserted] = await db
    .insert(users)
    .values({
      googleId,
      email: `impersonate-${channelInfo.handle}@local`,
      name: `Impersonation: @${channelInfo.handle}`,
      avatarUrl: null,
      refreshToken: null
    })
    .returning({ id: users.id })
  const userId = inserted!.id
  await syncLinkedChannels(userId, [channelInfo])
  return userId
}
