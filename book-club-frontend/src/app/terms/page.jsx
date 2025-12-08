'use client';
import Navbar from '@/components/layout/PublicNavbar';

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <div className="ml-20 min-h-screen bg-neutral-50 p-8 sm:p-12">
        <div className="max-w-4xl mx-auto bg-white p-10 rounded-xl shadow-card">
          <h1 className="text-4xl font-heading text-neutral-900 mb-2">Términos y Condiciones</h1>
          <p className="text-neutral-500 mb-8 text-sm">Última actualización: Diciembre 2025</p>

          <div className="space-y-8 text-neutral-700 font-ui leading-relaxed text-justify">
            
            {/* Introducción General */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-primary-700">1. Introducción</h2>
              <p>
                Los presentes términos y condiciones constituyen las cláusulas legales que regulan la relación entre los usuarios y el titular de <strong>Book Club</strong>. Establecen cómo se puede usar la información y acceder a los contenidos de la página. Al utilizar esta aplicación, aceptas este acuerdo que detalla nuestras políticas y procedimientos.
              </p>
            </section>

            {/* Protección de Datos Personales (Requisito Tesis) */}
            <section className="bg-blue-50 p-6 rounded-lg border border-blue-100">
              <h2 className="text-xl font-bold mb-3 text-blue-800">2. Protección de Datos Personales</h2>
              <p className="mb-4">
                Reconocemos el derecho del usuario a decidir o autorizar de forma libre, previa, expresa e informada la recolección, uso o tratamiento de sus datos personales. Asimismo, garantizamos su derecho a conocer, actualizar, rectificar, suprimir o controlar lo que se hace con su información.
              </p>
              <p className="font-medium">
                Gestión de eliminación:
              </p>
              <p>
                En cumplimiento con las normativas vigentes, Book Club incluye una funcionalidad accesible desde el "Perfil de Usuario" que permite gestionar la <strong>eliminación total</strong> de sus datos personales capturados por la aplicación, independientemente de la desinstalación de la misma.
              </p>
            </section>

            {/* Propiedad Intelectual y Seguridad */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-primary-700">3. Propiedad Intelectual y Seguridad</h2>
              <p>
                Todo el contenido generado por la plataforma (código, diseño, logotipos) es propiedad intelectual de los desarrolladores de Book Club. El contenido subido por los usuarios (libros en PDF/EPUB) es responsabilidad exclusiva de quien lo sube.
              </p>
              <p className="mt-2">
                Implementamos medidas de seguridad para la gestión de datos en el sitio, asegurando la integridad y confidencialidad de la información del usuario.
              </p>
            </section>

            {/* Cookies */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-primary-700">4. Uso de Cookies</h2>
              <p>
                Esta aplicación puede utilizar cookies y tecnologías similares para mejorar la experiencia del usuario, mantener la sesión activa y recordar sus preferencias de lectura.
              </p>
            </section>

            {/* Modificaciones */}
            <section>
              <h2 className="text-xl font-bold mb-3 text-primary-700">5. Modificaciones</h2>
              <p>
                El contenido de esta sección no es fijo y puede variar dependiendo de la evolución de las funciones del sistema. Nos reservamos el derecho a modificar estos términos en cualquier momento.
              </p>
            </section>

          </div>
        </div>
      </div>
    </>
  );
}