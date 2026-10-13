'use client'

/** Organisateur : « Mon équipe habituelle », les personnes déjà bookées, à rebooker en un clic. */

import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import { publicProfileHref } from '@/components/profile/utils'
import { EmptyLine, SpacePanel, type Person } from './ui'

export type TeamMember = Person & { collaborations: number; lastDate: string; specialty: string | null; location: string | null }

export default function TeamPanel({ team }: { team: TeamMember[] }) {
  return (
    <SpacePanel kicker="Réseau" title="Mon équipe habituelle">
      {team.length === 0 ? (
        <EmptyLine>Les artistes et prestataires avec qui vous avez travaillé apparaîtront ici, prêts à être rebookés.</EmptyLine>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {team.map(member => {
            const href = publicProfileHref(member.role, member.userId ?? 0)
            return (
              <div key={member.profileId} className="grid gap-2.5 rounded-[14px] border border-line bg-surface-2 p-3">
                <div className="flex items-center gap-2.5">
                  <SafeImage type="avatar" src={member.avatar} name={member.name} size={40} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-white">{member.name}</p>
                    <p className="truncate text-[11px] text-muted">{[member.specialty, member.location].filter(Boolean).join(' · ') || 'Profil LS Bookers'}</p>
                  </div>
                </div>
                <p className="text-[11px] text-white/45">
                  <b className="font-semibold text-gold-light">{member.collaborations} collaboration{member.collaborations > 1 ? 's' : ''}</b>
                  {' · dernière le '}{new Date(member.lastDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <div className="flex gap-1.5">
                  {href && (
                    <Link href={`${href}#agenda`} className="flex-1 rounded-lg bg-accent px-2 py-1.5 text-center text-xs font-semibold text-white transition hover:bg-accent-strong">
                      Rebooker
                    </Link>
                  )}
                  {member.userId && (
                    <Link href={`/messages?to=${member.userId}`} className="rounded-lg border border-line px-2.5 py-1.5 text-xs text-white/70 transition hover:text-white">
                      Message
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </SpacePanel>
  )
}
