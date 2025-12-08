'use client';

import { useState, useEffect } from 'react';
import { X, Copy, Mail, Check, Link as LinkIcon } from 'lucide-react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function InviteModal({ isOpen, onClose, type = 'app', targetId = null, title }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  // Generar el link cuando se abre el modal
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      // Genera: http://localhost:3000/invite?target=group&id=123
      const baseUrl = window.location.origin;
      let link = `${baseUrl}/invite?target=${type}`;
      if (targetId) link += `&id=${targetId}`;
      setInviteLink(link);
    }
  }, [isOpen, type, targetId]);

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast.success('Enlace copiado al portapapeles');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setLoading(true);
      // Usamos el endpoint de invitar que ya creamos
      await api.post('/api/users/invite', { email }); 
      // Nota: El correo actual envía un link genérico a la app. 
      // Para enviar el link del grupo, habría que actualizar el backend, 
      // pero por ahora el usuario puede copiar el link de arriba y pegarlo.
      
      toast.success('Invitación enviada por correo');
      setEmail('');
    } catch (error) {
      toast.error('Error al enviar correo');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 animate-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-100 flex justify-between items-center bg-neutral-50">
          <h3 className="font-heading font-bold text-lg text-neutral-800">
            {title || 'Invitar amigos'}
          </h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Opción 1: Copiar Link */}
          <div>
            <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">
              Comparte el enlace
            </label>
            <div className="flex gap-2">
              <div className="flex-1 bg-neutral-100 border border-neutral-200 rounded-lg px-3 py-2 text-sm text-neutral-600 truncate font-mono">
                {inviteLink}
              </div>
              <button 
                onClick={handleCopy}
                className={`p-2 rounded-lg border transition-all ${copied ? 'bg-green-50 border-green-200 text-green-600' : 'bg-white border-neutral-200 hover:border-primary-300 text-neutral-600'}`}
                title="Copiar enlace"
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-neutral-400 mt-2">
              Envía este enlace por WhatsApp, Telegram o donde quieras.
            </p>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-neutral-200"></div>
            <span className="flex-shrink-0 mx-4 text-neutral-400 text-xs uppercase">O enviar por correo</span>
            <div className="flex-grow border-t border-neutral-200"></div>
          </div>

          {/* Opción 2: Enviar Correo */}
          <form onSubmit={handleSendEmail}>
            <label className="text-xs font-bold text-neutral-500 uppercase mb-2 block">
              Enviar invitación oficial
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input 
                  type="email" 
                  placeholder="correo@ejemplo.com" 
                  className="input-field pl-9 w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button 
                type="submit" 
                disabled={loading || !email}
                className="btn-primary whitespace-nowrap"
              >
                {loading ? '...' : 'Enviar'}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}