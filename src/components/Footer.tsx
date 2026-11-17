export default function Footer() {
  return (
    <footer className="bg-black text-white text-sm py-6 text-center mt-10">
      <div className="mb-2">
        © {new Date().getFullYear()} LSBookers – Tous droits réservés.
      </div>
      <div className="flex justify-center gap-6">
        <a href="/legal/mentions" className="hover:underline">Mentions légales</a>
        <a href="/legal/conditions" className="hover:underline">Conditions et confidentialité</a>
        <a href="/contact" className="hover:underline">Contact</a>
      </div>
    </footer>
  )
}