import { NextRequest, NextResponse } from 'next/server'
import { getInvite, deleteInvite, listCollection, getGuild, getUser, addGuildResource } from '@/lib/discord-store'
import { getUserIdFromAuth } from '@/lib/auth-helper'
import { broadcastGatewayEvent } from '@/lib/gateway-broadcast'

type Context = { params: Promise<{ code: string }> }

export async function GET(_: NextRequest, { params }: Context) {
  const { code } = await params
  let invite: any = await getInvite(code)
  if (!invite) {
    const list = await listCollection('invites')
    const found = list.find((item: any) => item.code === code || item.id === code)
    if (!found) {
      return NextResponse.json({ message: 'Unknown Invite', code: 10006 }, { status: 404 })
    }
    invite = found
  }

  // Populate approximate counts and guild details if guild exists
  if (invite.guild?.id) {
    const guild = await getGuild(invite.guild.id)
    if (guild) {
      const memberCount = Array.isArray(guild.members) ? guild.members.length : (Number(guild.member_count) || 1)
      invite = {
        ...invite,
        approximate_member_count: memberCount,
        approximate_presence_count: Math.max(1, Math.floor(memberCount / 2)),
        guild: {
          ...invite.guild,
          id: guild.id,
          name: guild.name,
          icon: guild.icon,
          features: guild.features || [],
          verification_level: guild.verification_level ?? 0,
          nsfw_level: guild.nsfw_level ?? 0,
          premium_subscription_count: guild.premium_subscription_count ?? 0,
        },
      }
    }
  }

  return NextResponse.json(invite)
}

export async function POST(request: NextRequest, { params }: Context) {
  const { code } = await params
  let invite: any = await getInvite(code)
  if (!invite) {
    const list = await listCollection('invites')
    const found = list.find((item: any) => item.code === code || item.id === code)
    if (!found) {
      return NextResponse.json({ message: 'Unknown Invite', code: 10006 }, { status: 404 })
    }
    invite = found
  }

  const userId = getUserIdFromAuth(request)
  const user = (await getUser(userId)) || (await getUser('900000000000000001'))

  if (invite.guild?.id && user) {
    const guild = await getGuild(invite.guild.id)
    if (guild) {
      const members = (guild.members as Array<Record<string, unknown>>) || []
      const alreadyMember = members.some((m: any) => m.user?.id === user.id || m.id === user.id)
      if (!alreadyMember) {
        await addGuildResource(invite.guild.id, 'members', {
          user,
          roles: [],
          joined_at: new Date().toISOString(),
          deaf: false,
          mute: false,
        })
        await broadcastGatewayEvent('GUILD_MEMBER_ADD', {
          guild_id: invite.guild.id,
          user,
          roles: [],
          joined_at: new Date().toISOString(),
        })
      }
    }
  }

  return NextResponse.json({
    ...invite,
    new_member: true,
  }, { status: 200 })
}

export async function DELETE(_: NextRequest, { params }: Context) {
  const { code } = await params
  const deleted = await deleteInvite(code)
  if (!deleted) {
    return NextResponse.json({ message: 'Unknown Invite', code: 10006 }, { status: 404 })
  }
  return NextResponse.json(deleted)
}
