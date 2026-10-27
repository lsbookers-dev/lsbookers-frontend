/** Rubriques de la page Réglages (choix S1 d'Antho, 21/10/2026) */
import type { LsIconName } from '@/components/ui/LsIcon'

export type SettingsNavItem = { href: string; label: string; hint: string; icon: LsIconName }

export const SETTINGS_NAV: SettingsNavItem[] = [
  { href: '/settings/account',       label: 'Mon compte',                 hint: 'Adresse e-mail, infos privées',          icon: 'user' },
  { href: '/settings/security',      label: 'Connexion et sécurité',      hint: 'Mot de passe, appareils connectés',      icon: 'shield' },
  { href: '/settings/notifications', label: 'Notifications et e-mails',   hint: 'Ce que vous recevez, et comment',        icon: 'bell' },
  { href: '/settings/management',    label: 'Gestion de mon profil',      hint: 'Qui gère votre profil, accès',    icon: 'follow' },
  { href: '/settings/privacy',       label: 'Confidentialité',            hint: 'Messages, visibilité, comptes bloqués',  icon: 'lock' },
  { href: '/settings/subscription',  label: 'Abonnement et paiements',    hint: 'Votre formule, être payé en ligne',      icon: 'payment' },
  { href: '/settings/data',          label: 'Mes données',                hint: 'Télécharger, mettre en pause, supprimer', icon: 'document' },
  { href: '/settings/help',          label: 'Aide et informations légales', hint: 'Nous contacter, CGU, confidentialité', icon: 'comment' },
]
