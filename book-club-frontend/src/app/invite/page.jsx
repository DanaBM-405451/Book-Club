'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { BookOpen, UserPlus, Users, LogIn, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Componente interno para manejar los params
function InviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();

  // Capturamos parámetros: ?target=group&id=7
  const target = searchParams.get('target'); // 'group' | 'friend'
  const id = searchParams.get('id');       // ID del grupo o usuario

  // Determinar destino final
  let destinationUrl = '/dashboard';
  let title = 'Te han invitado a Book Club';
  let subtitle = 'Únete a nuestra comunidad de lectores.';
  let Icon = BookOpen;

  if (target === 'group' && id) {
    destinationUrl = `/groups/${id}`;
    title = 'Invitación a Grupo de Lectura';
    subtitle = 'Te han invitado a unirte a un grupo exclusivo para compartir lecturas.';
    Icon = Users;
  } else if (target === 'friend' && id) {
    destinationUrl = `/profile/${id}`; // O la página de aceptar solicitud
    title = 'Solicitud de Amistad';
    subtitle = 'Alguien quiere conectar contigo para compartir libros.';
    Icon = UserPlus;
  }

  // 🚀 Redirección automática si ya está logueado
  useEffect(() => {
    if (isAuthenticated) {
      router.replace(destinationUrl);
    }
  }, [isAuthenticated, destinationUrl, router]);

  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-neutral-600 font-ui">Redirigiendo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center p-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-3">
        <div className="bg-primary-600 p-3 rounded-xl shadow-lg">
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-heading text-neutral-900">Book Club</h1>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-neutral-100">
        <div className="bg-primary-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Icon className="w-10 h-10 text-primary-600" />
        </div>

        <h2 className="text-2xl font-bold text-neutral-800 mb-2">{title}</h2>
        <p className="text-neutral-600 mb-8 font-ui leading-relaxed">
          {subtitle}
          <br />
          <span className="text-sm text-neutral-400 mt-2 block">
            Para continuar, necesitas acceder a tu cuenta.
          </span>
        </p>

        <div className="space-y-4">
          {/* Opción 1: Ya tengo cuenta */}
          <Link 
            href={`/login?returnUrl=${encodeURIComponent(destinationUrl)}`}
            className="block w-full"
          >
            <button className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 transition-all">
              <LogIn className="w-5 h-5" />
              Ya tengo cuenta
            </button>
          </Link>

          {/* Separador */}
          <div className="relative py-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-neutral-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-neutral-400 font-medium">O si eres nuevo</span>
            </div>
          </div>

          {/* Opción 2: Soy nuevo */}
          <Link 
            href={`/register?returnUrl=${encodeURIComponent(destinationUrl)}`}
            className="block w-full"
          >
            <button className="w-full py-4 rounded-xl border-2 border-neutral-200 text-neutral-700 font-bold hover:border-primary-500 hover:text-primary-600 hover:bg-primary-50 transition-all flex items-center justify-center gap-2">
              Crear cuenta nueva <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>

      <p className="mt-8 text-neutral-400 text-sm">
        © 2025 Book Club. Todos los derechos reservados.
      </p>
    </div>
  );
}

// Wrapper principal con Suspense (Requerido por Next.js 13+ para useSearchParams)
export default function InvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <InviteContent />
    </Suspense>
  );
}