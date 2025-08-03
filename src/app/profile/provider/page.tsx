'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

export default function ProviderProfilePage() {
  const [user, setUser] = useState<{ name: string } | null>(null);
  const [types, setTypes] = useState<string[]>([]);
  const [newType, setNewType] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [radius, setRadius] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data.user);
        setTypes(res.data.user.profile.specialties || []);
        setCity(res.data.user.profile.city || '');
        setCountry(res.data.user.profile.country || '');
        setRadius(res.data.user.profile.radius || '');
        setDescription(res.data.user.profile.description || '');
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, []);

  const saveLocation = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        '/api/profile/location',
        { city, country, radius },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const addType = async () => {
    if (!newType || types.includes(newType)) return;
    try {
      const token = localStorage.getItem('token');
      const updated = [...types, newType];
      await axios.put(
        '/api/profile/specialties',
        { specialties: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTypes(updated);
      setNewType('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDateSelect = (info: { startStr: string }) => {
    console.log('📅 Date sélectionnée :', info.startStr);
    // TODO: connecter à l’API calendrier
  };

  return (
    <div className="p-4 text-white bg-black min-h-screen">
      <div className="text-2xl font-bold mb-2">{user?.name}</div>
      <div className="text-gray-400 mb-4">
        🛠️ Prestataire – {types.join(', ') || 'Aucun type défini'}
      </div>

      {/* Choix du type de prestataire */}
      <div className="mb-6">
        <label className="block font-semibold mb-1">🛠️ Modifier mes prestations</label>
        <div className="flex items-center gap-2">
          <select
            className="text-black p-2 rounded"
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
          >
            <option value="">-- Sélectionner --</option>
            <option value="Traiteur">Traiteur</option>
            <option value="Photobooth">Photobooth</option>
            <option value="Artificier">Artificier</option>
            <option value="Photographe">Photographe</option>
            <option value="Décorateur">Décorateur</option>
          </select>
          <button
            onClick={addType}
            className="bg-blue-600 px-4 py-2 rounded text-white"
          >
            Ajouter
          </button>
        </div>
      </div>

      {/* Zone géographique */}
      <div className="mb-6">
        <label className="block font-semibold mb-1">📍 Zone d’intervention</label>
        <div className="flex items-center gap-2">
          <input
            className="text-black p-2 rounded w-1/3"
            placeholder="Ville"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
          <input
            className="text-black p-2 rounded w-1/3"
            placeholder="Pays"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
          <input
            className="text-black p-2 rounded w-1/3"
            placeholder="Rayon (km)"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
          <button
            onClick={saveLocation}
            className="bg-green-600 px-4 py-2 rounded"
          >
            Sauvegarder
          </button>
        </div>
      </div>

      {/* Description libre */}
      <div className="mb-6">
        <label className="block font-semibold mb-1">📝 Description de mes prestations</label>
        <textarea
          className="w-full p-3 rounded text-black bg-gray-800"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Décrivez librement ce que vous proposez..."
        />
      </div>

      {/* Calendrier */}
      <div className="mb-8">
        <h2 className="font-semibold text-lg mb-2">📅 Planning</h2>
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          selectable={true}
          select={handleDateSelect}
          height={500}
        />
      </div>

      {/* Galerie médias */}
      <div className="mb-8">
        <h2 className="font-semibold text-lg mb-2">📸 Galerie</h2>
        <p className="text-gray-400">Zone d’upload de photos/vidéos à venir.</p>
      </div>
    </div>
  );
}