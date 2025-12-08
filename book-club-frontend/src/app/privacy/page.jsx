'use client';
import PublicNavbar from '@/components/layout/PublicNavbar';

export default function PrivacyPage() {
  return (
    <>
      <PublicNavbar />
      <div className="min-h-screen bg-neutral-50 p-8 sm:p-12">
        <div className="max-w-4xl mx-auto bg-white p-10 rounded-xl shadow-card">
          <h1 className="text-4xl font-heading text-neutral-900 mb-6">Política de Privacidad</h1>
          
          <div className="space-y-6 text-neutral-700 font-ui leading-relaxed text-justify">
            <section>
              <h2 className="text-xl font-bold mb-2 text-primary-700">1. Recopilación de Datos</h2>
              <p>Para brindarte el servicio de lectura y seguimiento, recopilamos datos básicos como tu nombre, correo electrónico y progreso de lectura. No compartimos esta información con terceros con fines comerciales.</p>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-2 text-primary-700">2. Seguridad</h2>
              <p>Tus datos están almacenados en servidores seguros. Las contraseñas se encuentran encriptadas y no son accesibles ni siquiera para los administradores del sistema.</p>
            </section>
            
            <section>
              <h2 className="text-xl font-bold mb-2 text-primary-700">3. Derechos del Usuario</h2>
              <p>Como usuario, tienes derecho a acceder, rectificar y solicitar la eliminación de tus datos personales en cualquier momento desde la configuración de tu perfil.</p>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}