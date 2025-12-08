'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/layout/Navbar';
import api from '@/lib/api';
import { 
  Users, BookOpen, TrendingUp, Mail, Shield, Activity, Download, CheckCircle, FileText
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  // Estados
  const [loading, setLoading] = useState(true); // ✅ Aquí está definido
  const [stats, setStats] = useState({
    users: { total: 0, active: 0, newUsers: 0 },
    books: { total: 0, reads: 0, list: [] },
    groups: { total: 0 }
  });
  
  const [activityLog, setActivityLog] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    if (user?.role !== 'ADMIN') {
      router.push('/dashboard');
      return;
    }
    
    loadData();
    document.body.setAttribute('data-date', new Date().toLocaleDateString());
  }, [isAuthenticated, user, router]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log("📥 Cargando datos del dashboard...");
      
      // Llamada paralela a los 3 servicios
      const [usersRes, booksRes, socialRes] = await Promise.allSettled([
        api.get('/api/users/admin/stats'),
        api.get('/api/library/books/admin/stats'),
        api.get('/api/social/groups/admin/stats')
      ]);

      const newStats = { ...stats };
      let activities = [];

      // 1. PROCESAR USUARIOS
      if (usersRes.status === 'fulfilled') {
        const d = usersRes.value.data.data || usersRes.value.data || {};
        console.log("👤 Users Data:", d);

        newStats.users = { 
            total: d.totalUsers || 0, 
            active: d.activeUsers || 0,
            newUsers: d.newUsers || 0
        };
        
        if (d.latestUsers && Array.isArray(d.latestUsers)) {
            d.latestUsers.forEach(u => activities.push({
                type: 'USER', text: `Nuevo usuario: ${u.username}`, date: u.createdAt
            }));
        }
      } else {
        console.error("❌ Error cargando usuarios:", usersRes.reason);
      }

      // 2. PROCESAR GRUPOS (SOCIAL)
      if (socialRes.status === 'fulfilled') {
        const d = socialRes.value.data.data || socialRes.value.data || {};
        console.log("👥 Groups Data:", d);

        newStats.groups = { 
            total: d.totalGroups || 0 
        };
        
        if (d.latestGroups && Array.isArray(d.latestGroups)) {
            d.latestGroups.forEach(g => activities.push({
                type: 'GROUP', text: `Se creó el grupo: "${g.name}"`, date: g.createdAt
            }));
        }
      } else {
        console.error("❌ Error cargando grupos:", socialRes.reason);
      }

      // 3. PROCESAR LIBROS
      if (booksRes.status === 'fulfilled') {
        const d = booksRes.value.data.data || booksRes.value.data || {};
        console.log("📚 Books Data:", d);

        let booksList = d.latestBooks || [];

        // Enriquecer con nombres de usuarios
        if (booksList.length > 0) {
            try {
                const userIds = [...new Set(booksList.map(b => b.uploadedByUserId).filter(id => id))];
                if (userIds.length > 0) {
                    const profilesRes = await api.post('/api/users/batch', { userIds });
                    const profiles = profilesRes.data.data || [];
                    const namesMap = {};
                    profiles.forEach(p => namesMap[p.userId] = p.username);
                    
                    booksList = booksList.map(b => ({
                        ...b,
                        uploaderName: namesMap[b.uploadedByUserId] || 'Desconocido'
                    }));
                }
            } catch (e) { console.warn("⚠️ No se pudieron cargar nombres", e); }
        }

        newStats.books = { 
            total: d.totalBooks || 0, 
            reads: d.totalReads || 0, 
            list: booksList 
        };
        
        booksList.forEach(b => activities.push({
            type: 'BOOK', text: `Libro subido: "${b.titulo}"`, date: b.createdAt
        }));
      }

      // Ordenar y actualizar estado
      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setStats(newStats);
      setActivityLog(activities.slice(0, 8));

    } catch (error) {
      console.error("🔥 Error fatal en dashboard:", error);
      toast.error("Error parcial al cargar datos");
    } finally {
        setLoading(false); // ✅ Ahora sí debería funcionar
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    try {
      setSendingInvite(true);
      await api.post('/api/users/invite', { email: inviteEmail });
      toast.success(`Invitación enviada a ${inviteEmail}`);
      setInviteEmail('');
    } catch (error) {
      console.error(error);
      toast.error('Error al enviar la invitación');
    } finally {
      setSendingInvite(false);
    }
  };

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />

      <div className="ml-20 min-h-screen bg-[#f8f9fa] p-8 print:ml-0 print:p-0 print:bg-white">
        <div className="max-w-6xl mx-auto print:max-w-none">
          
          {/* Header */}
          <div className="flex justify-between items-end mb-8 print:mb-4 print:border-b-2 print:border-black print:pb-4">
            <div className="print:w-full print:text-center">
              <h1 className="text-3xl font-heading text-neutral-900 flex items-center gap-3 print:justify-center">
                <Shield className="w-8 h-8 text-primary-600 print:text-black" />
                Reporte de Control
              </h1>
              <p className="text-neutral-500 mt-1 font-ui print:text-black">
                Resumen ejecutivo de la plataforma Book Club.
              </p>
              <p className="hidden print:block text-sm text-gray-500 mt-2">
                Generado el: {new Date().toLocaleDateString()}
              </p>
            </div>
            <button onClick={() => window.print()} className="btn-outline flex items-center gap-2 text-sm print:hidden">
              <Download className="w-4 h-4" /> Exportar Reporte
            </button>
          </div>

          {/* KPIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:grid-cols-4 print:gap-4">
             <StatCard title="Total Usuarios" value={stats.users.total} icon={Users} color="blue" />
             <StatCard title="Libros Subidos" value={stats.books.total} icon={BookOpen} color="green" />
             <StatCard title="Lecturas Finalizadas" value={stats.books.reads} icon={CheckCircle} color="purple" />
             <StatCard title="Total Grupos" value={stats.groups.total} icon={Activity} color="orange" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
            
            {/* COLUMNA IZQUIERDA */}
            <div className="lg:col-span-1 space-y-6">
               {/* Invitación (No Print) */}
               <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200 print:hidden">
                  <h3 className="font-bold mb-4 flex gap-2 items-center text-neutral-800"><Mail className="w-5 h-5 text-primary-500"/> Invitar Usuario</h3>
                  <form onSubmit={handleInvite} className="space-y-3">
                    <div>
                      <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Email</label>
                      <input 
                        type="email" 
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="ejemplo@correo.com"
                        className="input-field w-full"
                        required
                      />
                    </div>
                    <button type="submit" disabled={sendingInvite || !inviteEmail} className="btn-primary w-full justify-center">
                      {sendingInvite ? 'Enviando...' : 'Enviar Invitación'}
                    </button>
                  </form>
               </div>

               {/* LOG DE ACTIVIDAD */}
               <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200 print:border-gray-300 print:shadow-none print:break-inside-avoid">
                  <h3 className="font-bold text-neutral-800 mb-4 flex items-center gap-2">
                     <Activity className="w-5 h-5 text-orange-500"/> Actividad Reciente
                  </h3>
                  <div className="space-y-4">
                     {activityLog.length === 0 ? <p className="text-sm text-neutral-400">Sin actividad reciente.</p> : 
                        activityLog.map((log, i) => (
                           <div key={i} className="flex gap-3 items-start text-sm border-b border-neutral-50 pb-2 last:border-0">
                              <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.type==='USER'?'bg-blue-500':log.type==='BOOK'?'bg-green-500':'bg-orange-500'}`}></span>
                              <div>
                                 <p className="text-neutral-700 font-medium">{log.text}</p>
                                 <p className="text-xs text-neutral-400">{new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString()}</p>
                              </div>
                           </div>
                        ))
                     }
                  </div>
               </div>
            </div>

            {/* COLUMNA DERECHA: TABLA DE LIBROS */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-neutral-200 print:border-gray-300 print:shadow-none print:mt-6">
               <h3 className="font-bold text-neutral-800 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500"/> Últimos Libros Subidos
               </h3>
               
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b">
                        <tr>
                           <th className="px-4 py-3">Título</th>
                           <th className="px-4 py-3">Autor</th>
                           <th className="px-4 py-3">Subido por</th>
                           <th className="px-4 py-3">Fecha</th>
                        </tr>
                     </thead>
                     <tbody>
                        {stats.books.list.map((book, i) => (
                           <tr key={i} className="border-b last:border-0 hover:bg-neutral-50">
                              <td className="px-4 py-3 font-medium text-neutral-800">{book.titulo}</td>
                              <td className="px-4 py-3 text-neutral-600">{book.autor}</td>
                              <td className="px-4 py-3 text-primary-600 font-medium">{book.uploaderName || 'Admin'}</td> 
                              <td className="px-4 py-3 text-neutral-500">{new Date(book.createdAt).toLocaleDateString()}</td>
                           </tr>
                        ))}
                        {stats.books.list.length === 0 && (
                           <tr><td colSpan="4" className="px-4 py-8 text-center text-neutral-400">No hay libros registrados</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}

function StatCard({ title, value, icon: Icon, color }) {
   const colors = {
      blue: 'text-blue-600 bg-blue-50 border-blue-500',
      green: 'text-green-600 bg-green-50 border-green-500',
      purple: 'text-purple-600 bg-purple-50 border-purple-500',
      orange: 'text-orange-600 bg-orange-50 border-orange-500',
   };
   const c = colors[color];

   return (
      <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${c.split(' ')[2]} print:border print:border-gray-300 print:shadow-none`}>
         <div className="flex justify-between items-start">
            <div>
               <p className="text-xs font-bold text-neutral-400 uppercase">{title}</p>
               <h3 className="text-3xl font-bold text-neutral-800 mt-1">{value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${c.split(' ')[1]} ${c.split(' ')[0]} print:hidden`}>
               <Icon className="w-6 h-6" />
            </div>
         </div>
      </div>
   );
}