'use client';
import Navbar from '@/components/layout/PublicNavbar';
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    question: "¿Qué formatos de libros soporta la plataforma?",
    answer: "Actualmente soportamos archivos en formato PDF y EPUB. Nuestro lector integrado te permite subrayar y tomar notas en ambos formatos."
  },
  {
    question: "¿Cómo funcionan los puntos (XP) y niveles?",
    answer: "Ganas XP por cada página leída, al terminar libros, al unirte a grupos y participar en retos. A medida que acumulas XP, subes de nivel y desbloqueas insignias en tu perfil."
  },
  {
    question: "¿Puedo invitar amigos a un grupo privado?",
    answer: "¡Sí! Si eres administrador o miembro de un grupo, puedes invitar a tus amigos conectados en la plataforma o enviar invitaciones por correo electrónico a nuevos usuarios."
  },
  {
    question: "¿Mis notas son públicas?",
    answer: "Por defecto, las notas que tomas dentro de un libro son privadas. Sin embargo, puedes compartir fragmentos o comentarios en los foros de tus grupos de lectura."
  },
  {
    question: "¿Cómo creo un Reto de Lectura?",
    answer: "Dentro de un grupo, ve a la pestaña 'Propuestas'. Propón un libro y si resulta ganador en la votación, se convertirá automáticamente en el Reto Activo del grupo."
  },
  {
    question: "¿Cómo protegen mis datos personales?",
    answer: "Utilizamos encriptación estándar para tus contraseñas y tus datos de lectura solo son visibles para ti y tus amigos agregados."
  }
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <>
      <Navbar />
      <div className="ml-20 min-h-screen bg-neutral-50 p-8 sm:p-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-heading text-center text-neutral-900 mb-4">Preguntas Frecuentes</h1>
          <p className="text-center text-neutral-500 mb-12">Todo lo que necesitas saber para disfrutar de tu lectura.</p>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <button
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-neutral-50 transition-colors"
                >
                  <span className="font-bold text-neutral-800 text-lg">{faq.question}</span>
                  {openIndex === index ? <ChevronUp className="text-primary-500" /> : <ChevronDown className="text-neutral-400" />}
                </button>
                
                {openIndex === index && (
                  <div className="px-6 pb-6 pt-2 bg-neutral-50/50">
                    <p className="text-neutral-600 font-ui leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}