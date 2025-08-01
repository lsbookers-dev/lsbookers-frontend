'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

export default function AdminSettingsPage() {
  const [formData, setFormData] = useState({
    mainColor: '',
    secondaryColor: '',
    bannerUrl: '',
    welcomeText: '',
  });

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');

    axios.get('http://localhost:5001/api/admin/settings', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setFormData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');

    try {
      await axios.put('http://localhost:5001/api/admin/settings', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage('✅ Modifications enregistrées');
    } catch (err) {
      console.error(err);
      setMessage('❌ Erreur lors de la mise à jour');
    }
  };

  if (loading) return <p>Chargement...</p>;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Paramètres du site</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Couleur principale</label>
          <input type="color" name="mainColor" value={formData.mainColor} onChange={handleChange} className="w-16 h-10" />
        </div>

        <div>
          <label className="block">Couleur secondaire</label>
          <input type="color" name="secondaryColor" value={formData.secondaryColor} onChange={handleChange} className="w-16 h-10" />
        </div>

        <div>
          <label className="block">Texte d’accueil</label>
          <textarea name="welcomeText" value={formData.welcomeText} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <div>
          <label className="block">Bannière (URL)</label>
          <input type="text" name="bannerUrl" value={formData.bannerUrl} onChange={handleChange} className="w-full p-2 border rounded" />
        </div>

        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Enregistrer</button>
      </form>

      {message && <p className="mt-4">{message}</p>}
    </div>
  );
}