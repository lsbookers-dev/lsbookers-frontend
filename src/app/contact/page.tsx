export default function ContactPage() {
  return (
    <main className="min-h-screen px-4 py-20 text-white bg-black">
      <h1 className="text-3xl font-bold mb-6">Contactez-nous</h1>
      <p className="mb-4">Une question, une suggestion ou un besoin particulier ?</p>
      <form className="max-w-lg space-y-4">
        <input type="text" placeholder="Votre nom" className="w-full p-2 rounded bg-gray-800 text-white" />
        <input type="email" placeholder="Votre email" className="w-full p-2 rounded bg-gray-800 text-white" />
        <textarea placeholder="Votre message..." rows={6} className="w-full p-2 rounded bg-gray-800 text-white" />
        <button type="submit" className="px-4 py-2 bg-white text-black rounded hover:bg-gray-200">Envoyer</button>
      </form>
    </main>
  );
}