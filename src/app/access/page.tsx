'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AccessPage() {
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'test2025@') {
      document.cookie = "access_granted=true; path=/";
      router.push('/');
    } else {
      alert('Mot de passe incorrect');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white">
      <h1 className="text-2xl mb-4">Accès réservé</h1>
      <form onSubmit={handleSubmit} className="flex flex-col items-center">
        <input
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 text-black"
        />
        <button type="submit" className="mt-2 px-4 py-1 bg-white text-black rounded">
          Entrer
        </button>
      </form>
    </div>
  );
}