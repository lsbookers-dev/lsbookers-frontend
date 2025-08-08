'use client';

import Image from 'next/image';
import { useState } from 'react';

// Couleurs du thème (accord avec ton backend AdminSettings par défaut)
const ACCENT = '#FF0055';

type PromotedProfile = {
  id: number;
  name: string;
  roleLabel: string;
  city: string;
  avatar: string; // chemin local /public
};

type Post = {
  id: number;
  author: { name: string; avatar: string; roleLabel: string };
  image?: string;
  video?: string;
  caption: string;
  likes: number;
  time: string;
};

type LeaderboardItem = {
  id: number;
  name: string;
  tag: string;
  avatar: string;
  rank: number;
};

type Announcement = {
  id: number;
  title: string;
  place: string;
  date: string;
  need: string;
};

const promoted: PromotedProfile[] = [
  { id: 1, name: 'Mike Mike', roleLabel: 'DJ - Marseille', city: 'Marseille', avatar: '/avatars/a1.png' },
  { id: 2, name: 'Manon', roleLabel: 'Traiteur - Marseille', city: 'Marseille', avatar: '/avatars/a2.png' },
  { id: 3, name: 'Lena', roleLabel: 'Wedding Planner - Toulon', city: 'Toulon', avatar: '/avatars/a3.png' },
  { id: 4, name: 'Yoann', roleLabel: 'Décorateur - Marseille', city: 'Marseille', avatar: '/avatars/a4.png' },
  { id: 5, name: 'Théo', roleLabel: 'Photobooth - Avignon', city: 'Avignon', avatar: '/avatars/a5.png' },
  { id: 6, name: 'Jérôme', roleLabel: 'Traiteur - Paris', city: 'Paris', avatar: '/avatars/a6.png' },
];

const posts: Post[] = [
  {
    id: 1,
    author: { name: 'Studio 88', avatar: '/avatars/a7.png', roleLabel: 'Club - Marseille' },
    image: '/media/mix1.jpg',
    caption: 'Mix hier soir à Marseille 🎧🔥',
    likes: 39,
    time: 'Il y a 6h',
  },
  {
    id: 2,
    author: { name: 'Emilie', avatar: '/avatars/a8.png', roleLabel: 'Chanteuse - Lyon' },
    image: '/media/mix2.jpg',
    caption: 'Retour de scène incroyable !',
    likes: 24,
    time: 'Il y a 1j',
  },
];

const topArtists: LeaderboardItem[] = [
  { id: 1, name: 'Mike Mike', tag: 'DJ - Marseille', avatar: '/avatars/a1.png', rank: 1 },
  { id: 2, name: 'Emilie', tag: 'Chanteuse - Lyon', avatar: '/avatars/a8.png', rank: 2 },
  { id: 3, name: 'Nicolas', tag: 'DJ - Marseille', avatar: '/avatars/a9.png', rank: 3 },
  { id: 4, name: 'Coralie', tag: 'Danseuse - Lille', avatar: '/avatars/a10.png', rank: 4 },
  { id: 5, name: 'Lena', tag: 'Chanteuse - Paris', avatar: '/avatars/a3.png', rank: 5 },
];

const topProviders: LeaderboardItem[] = [
  { id: 1, name: 'Bob Sainfoncé', tag: 'Traiteur - Aubagne', avatar: '/avatars/a2.png', rank: 1 },
  { id: 2, name: 'La Sicile Authentique', tag: 'Traiteur - Marseille', avatar: '/avatars/a11.png', rank: 2 },
  { id: 3, name: 'Photobooth Pro', tag: 'Photobooth - Avignon', avatar: '/avatars/a5.png', rank: 3 },
  { id: 4, name: 'Wedding Planing', tag: 'Wedding Planner - Toulon', avatar: '/avatars/a12.png', rank: 4 },
  { id: 5, name: 'Décoratrice Marie', tag: 'Décoratrice - Marseille', avatar: '/avatars/a4.png', rank: 5 },
];

const annonces: Announcement[] = [
  { id: 1, title: 'Studio 88', place: 'Marseille', date: '25/10/2025', need: 'DJ' },
  { id: 2, title: 'Concert', place: 'Marseille', date: '21/06/2025', need: 'Chanteur' },
  { id: 3, title: 'Rooftop', place: 'La Ciotat', date: '25/08/2025', need: 'Danseur' },
  { id: 4, title: 'Société', place: 'Avignon', date: '25/11/2025', need: 'Traiteur' },
  { id: 5, title: 'Chez Mario', place: 'Cassis', date: '08/10/2025', need: 'Chanteur' },
  { id: 6, title: 'Wedding Planing', place: 'Aubagne', date: '25/10/2025', need: 'DJ' },
];

export default function HomePage() {
  // index = première carte visible (on en affiche 2 à la fois)
  const [index, setIndex] = useState(0);
  const maxIndex = Math.max(0, promoted.length - 2);

  const next = () => setIndex((i) => (i >= maxIndex ? 0 : i + 1));
  const prev = () => setIndex((i) => (i <= 0 ? maxIndex : i - 1));

  return (
    <main className="min-h-screen bg-black text-white">
      {/* Wrapper largeur */}
      <div className="mx-auto w-full max-w-6xl px-4 pt-6 pb-16">
        {/* CARROUSEL */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl md:text-2xl font-bold">Mises en avant</h2>
            <div className="flex gap-2">
              <button
                onClick={prev}
                className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10"
                aria-label="Précédent"
              >
                ‹
              </button>
              <button
                onClick={next}
                className="rounded-full border border-white/20 px-3 py-1 hover:bg-white/10"
                aria-label="Suivant"
              >
                ›
              </button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl bg-[#0f0f0f] p-4">
            <div
              className="flex gap-4 transition-transform duration-500"
              style={{ transform: `translateX(calc(${index} * -50% - ${index} * 0.5rem))` }}
            >
              {promoted.map((p) => (
                <div key={p.id} className="w-1/2 shrink-0">
                  <div className="rounded-xl bg-[#111] border border-white/10 p-4 hover:border-white/20 transition">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-14 overflow-hidden rounded-full ring-2 ring-white/10">
                        <Image src={p.avatar} alt={p.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold">{p.name}</p>
                        <p className="text-sm text-white/60">{p.roleLabel}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <span
                        className="inline-block rounded-full px-3 py-1 text-xs"
                        style={{ background: `${ACCENT}22`, color: ACCENT }}
                      >
                        {p.city}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* GRID PRINCIPALE : Publications + Classements */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
          {/* Publications (col-span-2) */}
          <div className="lg:col-span-2">
            <h3 className="mb-4 text-lg md:text-xl font-semibold">Publications</h3>
            <div className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-0">
              <div className="max-h-[70vh] overflow-y-auto divide-y divide-white/10">
                {posts.map((post) => (
                  <article key={post.id} className="p-4">
                    <header className="mb-3 flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/10">
                        <Image src={post.author.avatar} alt={post.author.name} fill className="object-cover" />
                      </div>
                      <div>
                        <p className="font-semibold leading-tight">{post.author.name}</p>
                        <p className="text-xs text-white/60">{post.author.roleLabel} • {post.time}</p>
                      </div>
                    </header>

                    {post.image && (
                      <div className="relative mb-3 w-full overflow-hidden rounded-xl border border-white/10">
                        <Image
                          src={post.image}
                          alt={post.caption}
                          width={1200}
                          height={800}
                          className="h-auto w-full object-cover"
                        />
                      </div>
                    )}

                    <p className="text-sm leading-relaxed">{post.caption}</p>

                    <footer className="mt-3 flex items-center gap-4 text-sm">
                      <button className="hover:text-white/90 text-white/70">❤️ {post.likes}</button>
                      <button className="hover:text-white/90 text-white/70">💬 Commenter</button>
                      <button className="hover:text-white/90 text-white/70">↗️ Partager</button>
                    </footer>
                  </article>
                ))}
              </div>
            </div>
          </div>

          {/* Classements (col 3) */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold">TOP ARTISTES</h4>
                <select
                  className="rounded-md bg-black/40 text-sm px-2 py-1 border border-white/10"
                  defaultValue="France"
                  aria-label="Filtre territoire"
                >
                  <option>France</option>
                  <option>Région</option>
                  <option>Ville</option>
                </select>
              </div>

              <ul className="space-y-3">
                {topArtists.map((a) => (
                  <li key={a.id} className="flex items-center gap-3 rounded-lg border border-white/10 p-2 hover:border-white/20 transition">
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold"
                      style={{ background: `${ACCENT}22`, color: ACCENT }}
                    >
                      {a.rank}
                    </span>
                    <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/10">
                      <Image src={a.avatar} alt={a.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.name}</p>
                      <p className="truncate text-xs text-white/60">{a.tag}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-[#0f0f0f] border border-white/10 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="font-semibold">TOP PRESTATAIRES</h4>
                <select
                  className="rounded-md bg-black/40 text-sm px-2 py-1 border border-white/10"
                  defaultValue="France"
                  aria-label="Filtre territoire"
                >
                  <option>France</option>
                  <option>Région</option>
                  <option>Ville</option>
                </select>
              </div>

              <ul className="space-y-3">
                {topProviders.map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-lg border border-white/10 p-2 hover:border-white/20 transition">
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold"
                      style={{ background: `${ACCENT}22`, color: ACCENT }}
                    >
                      {p.rank}
                    </span>
                    <div className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/10">
                      <Image src={p.avatar} alt={p.name} fill className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{p.name}</p>
                      <p className="truncate text-xs text-white/60">{p.tag}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ANNONCES */}
        <section className="mb-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg md:text-xl font-semibold">Annonces</h3>
            <button
              className="rounded-md border border-white/10 px-3 py-1 text-sm hover:bg-white/10"
              aria-label="Voir toutes les annonces"
            >
              Voir tout
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {annonces.map((a) => (
              <div key={a.id} className="rounded-xl bg-[#0f0f0f] border border-white/10 p-4 hover:border-white/20 transition">
                <h5 className="font-semibold">{a.title}</h5>
                <p className="text-sm text-white/60">{a.place}</p>
                <div className="mt-3 space-y-1 text-sm">
                  <p>Événement : <span className="text-white/90">—</span></p>
                  <p>Date : <span className="text-white/90">{a.date}</span></p>
                  <p>Recherche : <span className="text-white/90">{a.need}</span></p>
                </div>
                <button
                  className="mt-4 w-full rounded-lg py-2 font-medium"
                  style={{ background: ACCENT }}
                >
                  Contacter
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}