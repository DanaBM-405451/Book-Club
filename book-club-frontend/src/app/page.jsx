// src/app/page.jsx

import Link from 'next/link';
import { BookOpen, Sparkles, Users, Trophy } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-primary-500 p-6 rounded-full shadow-book">
              <BookOpen className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl font-heading mb-4 text-neutral-900">
            Book Club
          </h1>
          
          <p className="text-xl text-neutral-600 font-ui mb-8 max-w-2xl mx-auto">
            Tu biblioteca personal. 
            Lee, anota, compite y crece como lector.
          </p>

          <div className="flex gap-4 justify-center">
            <Link href="/login" className="btn-primary text-lg">
              Iniciar Sesión
            </Link>
            <Link href="/register" className="btn-outline text-lg">
              Crear Cuenta
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mt-16">
          <div className="card-vintage text-center">
            <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-8 h-8 text-primary-600" />
            </div>
            <h3 className="text-xl font-heading mb-2">Diviertete</h3>
            <p className="text-neutral-600 font-ui">
              Gana XP, sube de nivel y desbloquea logros mientras lees
            </p>
          </div>

          <div className="card-vintage text-center">
            <div className="bg-secondary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-secondary-600" />
            </div>
            <h3 className="text-xl font-heading mb-2">BookClub</h3>
            <p className="text-neutral-600 font-ui">
              Únete a grupos de lectura y comparte tus experiencias
            </p>
          </div>

          <div className="card-vintage text-center">
            <div className="bg-gold-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-8 h-8 text-gold-600" />
            </div>
            <h3 className="text-xl font-heading mb-2">Logros</h3>
            <p className="text-neutral-600 font-ui">
              Desbloquea más de 25 logros y demuestra tu dedicación
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center py-8 text-neutral-500 font-ui text-sm">
        <p>© 2025 Book Club. Hecho con ❤️ para los amantes de la lectura.</p>
      </footer>
    </div>
  );
}