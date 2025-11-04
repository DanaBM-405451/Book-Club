// src/app/login/page.jsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Mail, Lock } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const { login } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const result = await login({
        emailOrUsername: email,
        password,
      });

      if (result.success) {
        toast.success('¡Bienvenido de nuevo!');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        toast.error(result.message || 'Error al iniciar sesión');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Error al conectar con el servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-primary-50 to-secondary-50 p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center mb-8">
            <div className="bg-primary-500 p-4 rounded-full shadow-vintage hover:shadow-book transition-shadow">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
          </Link>

          {/* Card */}
          <div className="card-vintage">
            <h1 className="text-3xl font-heading text-center mb-2">Iniciar Sesión</h1>
            <p className="text-center text-neutral-600 mb-6 font-ui">
              Bienvenido de nuevo a tu biblioteca
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div>
                <label className="label-field">
                  <Mail className="w-4 h-4 inline mr-2" />
                  Email o Usuario
                </label>
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="admin@bookclub.com"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="label-field">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Contraseña
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Recordar / Olvidé */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-primary-500 border-neutral-300 rounded focus:ring-primary-400"
                  />
                  <span className="text-neutral-600 font-ui">Recordarme</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-primary-600 hover:underline font-ui font-medium"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span>Iniciando sesión...</span>
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>

            {/* Registro */}
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600 font-ui">
                ¿No tienes cuenta?{' '}
                <Link
                  href="/register"
                  className="text-primary-600 hover:underline font-medium"
                >
                  Regístrate aquí
                </Link>
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center mt-6">
            <Link
              href="/"
              className="text-sm text-neutral-600 hover:text-primary-600 font-ui"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}