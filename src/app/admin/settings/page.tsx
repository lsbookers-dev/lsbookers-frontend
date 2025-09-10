'use client';

import { useEffect, useState, useMemo } from 'react';

type SiteSettings = {
  mainColor: string;
  secondaryColor: string;
  welcomeText: string;
  bannerUrl: string;

  landingBgUrl: string;
  loginBgUrl: string;
  registerBgUrl: string;
  headerLogoUrl: string;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '').replace(/\/$/, '');

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState<SiteSettings>({
    mainColor: '#111111',
    secondaryColor: '#ffffff',
    welcomeText: '',
    bannerUrl: '',

    landingBgUrl: '',
    loginBgUrl: '',
    registerBgUrl: '',
    headerLogoUrl: '',
  });

  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>('');
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('token') : null), []);

  // ---- Load settings (admin) ----
  useEffect(() => {
    let alive = true;
    async function run() {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/api/admin/settings`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          cache: 'no-store',
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = (await res.json()) as Partial<SiteSettings>;
        if (alive) {
          setFormData((prev) => ({ ...prev, ...data }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (alive) setLoading(false);
      }
    }
    run();
    return () => {
      alive = false;
    };
  }, [token]);

  // ---- Helpers ----
  const setField = (name: keyof SiteSettings, value: string) =>
    setFormData((prev) => ({ ...prev, [name]: value }));

  const save = async () => {
    try {
      setMsg('');
      const res = await fetch(`${API_BASE}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      setMsg('✅ Modifications enregistrées');
    } catch (e) {
      console.error(e);
      setMsg('❌ Erreur lors de la mise à jour');
    }
  };

  const doUpload = async (file: File): Promise<string> => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', 'site');
    fd.append('type', 'image');
    const res = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: fd,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error || 'UPLOAD_FAILED');
    }
    const data = await res.json();
    return (data?.url as string) || '';
  };

  const handleFilePick =
    (field: keyof SiteSettings) => async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        setMsg('⏫ Upload en cours…');
        const url = await doUpload(file);
        setField(field, url);
        setMsg('✅ Image importée, pensez à enregistrer.');
      } catch (er) {
        console.error(er);
        setMsg('❌ Impossible de téléverser ce fichier');
      } finally {
        e.target.value = '';
      }
    };

  if (loading) return <div className="p-8 text-white">Chargement…</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto text-white">
      <h1 className="text-2xl font-bold mb-6">Paramètres du site</h1>

      <div className="space-y-6">
        {/* Couleurs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-neutral-900/60 border border-white/10 rounded-2xl p-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Couleur principale</label>
            <input
              type="color"
              value={formData.mainColor}
              onChange={(e) => setField('mainColor', e.target.value)}
              className="w-16 h-10"
            />
          </div>
          <div>
            <label className="block text-sm text-white/70 mb-1">Couleur secondaire</label>
            <input
              type="color"
              value={formData.secondaryColor}
              onChange={(e) => setField('secondaryColor', e.target.value)}
              className="w-16 h-10"
            />
          </div>
        </div>

        {/* Texte d’accueil + bannière générique */}
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4 space-y-4">
          <div>
            <label className="block text-sm text-white/70 mb-1">Texte d’accueil</label>
            <textarea
              value={formData.welcomeText}
              onChange={(e) => setField('welcomeText', e.target.value)}
              className="w-full p-3 rounded bg-black/30 border border-white/10"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
            <div>
              <label className="block text-sm text-white/70 mb-1">Bannière (URL)</label>
              <input
                value={formData.bannerUrl}
                onChange={(e) => setField('bannerUrl', e.target.value)}
                placeholder="https://…"
                className="w-full p-2 rounded bg-black/30 border border-white/10"
              />
            </div>
            <label className="inline-flex items-center px-3 py-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer">
              Importer
              <input type="file" accept="image/*" className="hidden" onChange={handleFilePick('bannerUrl')} />
            </label>
          </div>
        </div>

        {/* ✅ Nouveaux: images de fond + logo header */}
        <div className="bg-neutral-900/60 border border-white/10 rounded-2xl p-4 space-y-5">
          <h2 className="text-lg font-semibold">Images de fond & logo</h2>

          {/* Landing */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
            <div>
              <label className="block text-sm text-white/70 mb-1">Background landing (URL)</label>
              <input
                value={formData.landingBgUrl}
                onChange={(e) => setField('landingBgUrl', e.target.value)}
                placeholder="https://…"
                className="w-full p-2 rounded bg-black/30 border border-white/10"
              />
            </div>
            <label className="inline-flex items-center px-3 py-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer">
              Importer
              <input type="file" accept="image/*" className="hidden" onChange={handleFilePick('landingBgUrl')} />
            </label>
          </div>

          {/* Login */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
            <div>
              <label className="block text-sm text-white/70 mb-1">Background login (URL)</label>
              <input
                value={formData.loginBgUrl}
                onChange={(e) => setField('loginBgUrl', e.target.value)}
                placeholder="https://…"
                className="w-full p-2 rounded bg-black/30 border border-white/10"
              />
            </div>
            <label className="inline-flex items-center px-3 py-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer">
              Importer
              <input type="file" accept="image/*" className="hidden" onChange={handleFilePick('loginBgUrl')} />
            </label>
          </div>

          {/* Register */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
            <div>
              <label className="block text-sm text-white/70 mb-1">Background register (URL)</label>
              <input
                value={formData.registerBgUrl}
                onChange={(e) => setField('registerBgUrl', e.target.value)}
                placeholder="https://…"
                className="w-full p-2 rounded bg-black/30 border border-white/10"
              />
            </div>
            <label className="inline-flex items-center px-3 py-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer">
              Importer
              <input type="file" accept="image/*" className="hidden" onChange={handleFilePick('registerBgUrl')} />
            </label>
          </div>

          {/* Logo header */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 items-center">
            <div>
              <label className="block text-sm text-white/70 mb-1">Logo header (URL)</label>
              <input
                value={formData.headerLogoUrl}
                onChange={(e) => setField('headerLogoUrl', e.target.value)}
                placeholder="https://…"
                className="w-full p-2 rounded bg-black/30 border border-white/10"
              />
            </div>
            <label className="inline-flex items-center px-3 py-2 rounded bg-white/10 hover:bg-white/20 cursor-pointer">
              Importer
              <input type="file" accept="image/*" className="hidden" onChange={handleFilePick('headerLogoUrl')} />
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={save} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded">
            Enregistrer
          </button>
          {msg && <p className="self-center text-sm text-white/80">{msg}</p>}
        </div>
      </div>
    </div>
  );
}