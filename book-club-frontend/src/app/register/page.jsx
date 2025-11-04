'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Mail, Lock, User, ArrowRight, Calendar, Globe, MapPin } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    edad: '',
    genero: '',
    pais: '',
    ciudad: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones
    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    const age = parseInt(formData.age);
    if (age < 13) {
      toast.error('Debes tener al menos 13 años para registrarte');
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/auth/register`, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        edad: parseInt(formData.edad),
        genero: formData.genero,
        pais: formData.pais,
        ciudad: formData.ciudad,
      });

      if (response.data.success) {
        toast.success('¡Cuenta creada exitosamente!');
        setTimeout(() => {
          router.push('/login');
        }, 1500);
      }
    } catch (error) {
      console.error('Register error:', error);
      toast.error(error.response?.data?.message || 'Error al crear la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-center" />

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-neutral-50 via-secondary-50 to-primary-50 p-4">
        <div className="w-full max-w-2xl">
          {/* Logo */}
          <Link href="/" className="flex items-center justify-center mb-8">
            <div className="bg-secondary-500 p-4 rounded-full shadow-vintage hover:shadow-book transition-shadow">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
          </Link>

          {/* Card */}
          <div className="card-vintage">
            <h1 className="text-3xl font-heading text-center mb-2">Crear Cuenta</h1>
            <p className="text-center text-neutral-600 mb-6 font-ui">
              Únete a nuestra comunidad de lectores
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Grid de 2 columnas */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Username */}
                <div>
                  <label className="label-field">
                    <User className="w-4 h-4 inline mr-2" />
                    Usuario
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="johndoe"
                    required
                    disabled={isLoading}
                    minLength={3}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="label-field">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="tu@email.com"
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
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="label-field">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Confirmar Contraseña
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    minLength={6}
                  />
                </div>

                {/* Age */}
                <div>
                  <label className="label-field">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Edad
                  </label>
                  <input
                    type="number"
                    name="edad"
                    value={formData.age}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="18"
                    required
                    disabled={isLoading}
                    min={13}
                    max={120}
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="label-field">
                    <User className="w-4 h-4 inline mr-2" />
                    Género
                  </label>
                  <select
                    name="genero"
                    value={formData.gender}
                    onChange={handleChange}
                    className="input-field"
                    required
                    disabled={isLoading}
                  >
                    <option value="">Selecciona tu género</option>
                    <option value="MALE">Masculino</option>
                    <option value="FEMALE">Femenino</option>
                    <option value="NON_BINARY">No binario</option>
                    <option value="OTHER">Otro</option>
                    <option value="PREFER_NOT_TO_SAY">Prefiero no decir</option>
                  </select>
                </div>

                {/* Country */}
                <div>
                  <label className="label-field">
                    <Globe className="w-4 h-4 inline mr-2" />
                    País
                  </label>
                  <input
                    type="text"
                    name="pais"
                    value={formData.country}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Argentina"
                    required
                    disabled={isLoading}
                  />
                </div>

                {/* City */}
                <div>
                  <label className="label-field">
                    <MapPin className="w-4 h-4 inline mr-2" />
                    Ciudad
                  </label>
                  <input
                    type="text"
                    name="ciudad"
                    value={formData.city}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Buenos Aires"
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 mt-1 text-secondary-500 border-neutral-300 rounded focus:ring-secondary-400"
                />
                <span className="text-sm text-neutral-600 font-ui">
                  Acepto los{' '}
                  <Link href="/terms" className="text-secondary-600 hover:underline">
                    términos y condiciones
                  </Link>{' '}
                  y la{' '}
                  <Link href="/privacy" className="text-secondary-600 hover:underline">
                    política de privacidad
                  </Link>
                </span>
              </div>

              {/* Submit */}
              <button type="submit" disabled={isLoading} className="btn-primary w-full">
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
                    <span>Creando cuenta...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span>Crear Cuenta</span>
                    <ArrowRight className="w-5 h-5" />
                  </div>
                )}
              </button>
            </form>

            {/* Login link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-neutral-600 font-ui">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-secondary-600 hover:underline font-medium">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </div>

          {/* Back to home */}
          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-neutral-600 hover:text-secondary-600 font-ui">
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}