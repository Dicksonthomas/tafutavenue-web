export default function Footer() {
  return (
    <footer className="border-t border-slate-200 px-4 py-4 text-center text-xs text-slate-400 sm:px-6 lg:px-8">
      <p>&copy; {new Date().getFullYear()} University Venue Booking System — Mzumbe University. All rights reserved.</p>
      <p className="mt-0.5">Developed by Dickson Thomas</p>
    </footer>
  );
}
