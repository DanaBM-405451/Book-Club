'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/layout/Navbar';
import api from '@/lib/api';
import { 
  Users, BookOpen, Mail, Shield, Activity, Download, CheckCircle, FileText, Filter, Search
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

// Componente Tarjeta de Estadística (Optimizado para Impresión)
function StatCard({ title, value, icon: Icon, color }) {
    const colors = {
      blue: 'text-blue-600 bg-blue-50 border-blue-500',
      green: 'text-green-600 bg-green-50 border-green-500',
      purple: 'text-purple-600 bg-purple-50 border-purple-500',
      orange: 'text-orange-600 bg-orange-50 border-orange-500',
    };
    const c = colors[color] || colors.blue;
 
    return (
       <div className={`bg-white p-6 rounded-xl shadow-sm border-l-4 ${c.split(' ')[2]} 
         print:border print:border-gray-300 print:shadow-none print:rounded-none print:p-4 print:bg-white`}>
          <div className="flex justify-between items-start">
             <div>
                <p className="text-xs font-bold text-neutral-400 uppercase print:text-black">{title}</p>
                <h3 className="text-3xl font-bold text-neutral-800 mt-1 print:text-black">{value}</h3>
             </div>
             <div className={`p-3 rounded-lg ${c.split(' ')[1]} ${c.split(' ')[0]} print:hidden`}>
                <Icon className="w-6 h-6" />
             </div>
          </div>
       </div>
    );
 }

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  // Estados
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    genre: 'TODOS',
    searchUser: ''
  });

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: { total: 0, active: 0 },
    books: { total: 0, reads: 0, list: [] },
    groups: { total: 0 }
  });
  
  const [activityLog, setActivityLog] = useState([]);
  const [availableGenres, setAvailableGenres] = useState([]);

  useEffect(() => {
    if (!isAuthenticated) return router.push('/login');
    if (user?.role !== 'ADMIN') return router.push('/dashboard');
    
    loadInitialData();
  }, [isAuthenticated, user]);

  const loadInitialData = async () => {
      try {
          const genresRes = await api.get('/api/library/books/genres').catch(() => ({ data: { data: [] } }));
          setAvailableGenres(genresRes.data.data || []);
          await loadData();
      } catch (error) {
          console.error("Error inicial:", error);
      }
  };

  const handleFilter = () => {
    loadData();
    toast.success("Reporte actualizado");
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.genre !== 'TODOS') params.append('genre', filters.genre);
      const queryString = params.toString();

      console.log("📥 Cargando reporte:", queryString);

      const [usersRes, booksRes, socialRes] = await Promise.allSettled([
        api.get(`/api/users/admin/stats?${queryString}`),
        api.get(`/api/library/books/admin/stats?${queryString}`),
        api.get(`/api/social/groups/admin/stats?${queryString}`)
      ]);

      const newStats = { ...stats };
      let activities = [];

      // --- USUARIOS ---
      if (usersRes.status === 'fulfilled') {
        const d = usersRes.value.data.data || {};
        newStats.users = { total: d.totalUsers || 0, active: d.activeUsers || 0 };
        if (d.latestUsers) {
            d.latestUsers.forEach(u => activities.push({
                type: 'USER', text: `Usuario registrado: ${u.username}`, date: u.createdAt, user: u.username
            }));
        }
      }

      // --- GRUPOS ---
      if (socialRes.status === 'fulfilled') {
        const d = socialRes.value.data.data || {};
        newStats.groups = { total: d.totalGroups || 0 };
        if (d.latestGroups) {
            d.latestGroups.forEach(g => activities.push({
                type: 'GROUP', text: `Grupo creado: "${g.name}"`, date: g.createdAt, user: 'Sistema'
            }));
        }
      }

      // --- LIBROS ---
      if (booksRes.status === 'fulfilled') {
        const d = booksRes.value.data.data || {};
        let booksList = (d.latestBooks || []).map(b => ({ ...b, uploaderName: 'Cargando...' }));

        // Obtener nombres de usuarios
        const userIds = [...new Set(booksList.map(b => b.uploadedByUserId).filter(id => id))];
        if (userIds.length > 0) {
            try {
                const profilesRes = await api.post('/api/users/profiles/batch', { userIds });
                const profiles = profilesRes.data.data || [];
                const namesMap = {};
                profiles.forEach(p => namesMap[p.userId] = p.username);
                
                booksList = booksList.map(b => ({
                    ...b,
                    uploaderName: namesMap[b.uploadedByUserId] || 'Desconocido'
                }));
            } catch (e) { 
                console.warn("No se pudieron cargar nombres:", e);
                booksList = booksList.map(b => ({ ...b, uploaderName: 'Error' }));
            }
        }

        newStats.books = { total: d.totalBooks || 0, reads: d.totalReads || 0, list: booksList };
        
        booksList.forEach(b => activities.push({
            type: 'BOOK', text: `Libro subido: "${b.titulo}"`, date: b.createdAt, user: b.uploaderName
        }));
      }

      activities.sort((a, b) => new Date(b.date) - new Date(a.date));
      setStats(newStats);
      setActivityLog(activities);

    } catch (error) {
      console.error(error);
      toast.error("Error al cargar datos");
    } finally {
        setLoading(false);
    }
  };

  const filteredActivity = activityLog.filter(item => {
      if (!filters.searchUser) return true;
      const q = filters.searchUser.toLowerCase();
      return item.user?.toLowerCase().includes(q) || item.text?.toLowerCase().includes(q);
  });

  const filteredBooks = stats.books.list.filter(book => {
      if (!filters.searchUser) return true;
      const q = filters.searchUser.toLowerCase();
      return book.uploaderName?.toLowerCase().includes(q) || book.titulo?.toLowerCase().includes(q);
  });

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <>
      <Toaster position="top-center" />
      
      {/* 🛠️ Estilos Específicos para Impresión Limpia */}
      <style jsx global>{`
        @media print {
          @page { margin: 20mm; size: auto; }
          body { background: white !important; color: black !important; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          
          /* Forzar impresión de fondos (gráficos, barras) */
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          
          /* Tabla estilo Documento */
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ddd !important; padding: 8px !important; color: black !important; }
          thead { background-color: #f3f4f6 !important; font-weight: bold; }
          tr { break-inside: avoid; }
        }
      `}</style>

      <div className="print:hidden">
        <Navbar />
      </div>

      <div className="ml-20 min-h-screen bg-[#f8f9fa] p-8 print:ml-0 print:p-0 print:bg-white print:w-full">
        <div className="max-w-7xl mx-auto print:max-w-none">
          
          {/* HEADER DEL REPORTE */}
          <div className="flex justify-between items-end mb-6 print:mb-8 print:border-b-2 print:border-black print:pb-4">
            <div className="print:w-full">
              <div className="flex items-center gap-3 print:justify-center print:mb-2">
                <Shield className="w-8 h-8 text-primary-600 print:text-black" />
                <h1 className="text-3xl font-heading text-neutral-900 print:text-2xl print:text-black">
                  Reporte de Control - Book Club
                </h1>
              </div>
              <p className="text-neutral-500 mt-1 font-ui print:text-center print:text-sm print:text-gray-600">
                {filters.startDate 
                  ? `Periodo del reporte: ${new Date(filters.startDate).toLocaleDateString()} al ${filters.endDate ? new Date(filters.endDate).toLocaleDateString() : 'la fecha'}` 
                  : `Reporte histórico generado el ${new Date().toLocaleDateString()}`
                }
              </p>
            </div>
            <button onClick={() => window.print()} className="btn-outline flex items-center gap-2 text-sm print:hidden">
              <Download className="w-4 h-4" /> Exportar PDF
            </button>
          </div>

          {/* FILTROS (Ocultos al imprimir) */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 mb-8 flex flex-wrap gap-4 items-end print:hidden">
            <div>
                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Desde</label>
                <input type="date" className="input-field py-2 text-sm" value={filters.startDate} onChange={(e) => setFilters({...filters, startDate: e.target.value})} />
            </div>
            <div>
                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Hasta</label>
                <input type="date" className="input-field py-2 text-sm" value={filters.endDate} onChange={(e) => setFilters({...filters, endDate: e.target.value})} />
            </div>
            <div>
                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Género</label>
                <select className="input-field py-2 text-sm min-w-[200px]" value={filters.genre} onChange={(e) => setFilters({...filters, genre: e.target.value})}>
                    <option value="TODOS">Todos los géneros</option>
                    {availableGenres.map((g, i) => <option key={i} value={g}>{g}</option>)}
                </select>
            </div>
            <button onClick={handleFilter} className="btn-primary py-2 px-4 text-sm flex items-center gap-2 h-[42px]">
                <Filter className="w-4 h-4" /> Aplicar
            </button>
            <div className="w-px h-10 bg-neutral-200 mx-2"></div>
            <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Buscar</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input type="text" placeholder="Usuario, libro..." className="input-field pl-9 py-2 text-sm w-full" value={filters.searchUser} onChange={(e) => setFilters({...filters, searchUser: e.target.value})} />
                </div>
            </div>
          </div>

          {/* KPIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:grid-cols-4 print:gap-4 print:mb-8">
             <StatCard title="Total Usuarios" value={stats.users.total} icon={Users} color="blue" />
             <StatCard title="Total Libros" value={stats.books.total} icon={BookOpen} color="green" />
             <StatCard title="Lecturas Completadas" value={stats.books.reads} icon={CheckCircle} color="purple" />
             <StatCard title="Grupos Activos" value={stats.groups.total} icon={Activity} color="orange" />
          </div>

          {/* CONTENIDO PRINCIPAL */}
          {/* En pantalla: 2 columnas. En impresión: Apilado (Block) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
            
            {/* COLUMNA IZQUIERDA: LOG (Opcional en impresión, lo ponemos al final o lo ocultamos si prefieres) */}
            <div className="lg:col-span-1 space-y-6 print:mb-8 print:break-inside-avoid">
               <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200 print:hidden">
                  <h3 className="font-bold mb-4 flex gap-2 items-center text-neutral-800"><Mail className="w-5 h-5 text-primary-500"/> Acciones</h3>
                  <button className="btn-outline w-full text-sm" onClick={() => setFilters({ startDate: '', endDate: '', genre: 'TODOS', searchUser: '' }) || loadData()}>
                    Limpiar Filtros
                  </button>
               </div>

               <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200 print:border-black print:rounded-none print:shadow-none">
                  <h3 className="font-bold text-neutral-800 mb-4 flex items-center gap-2 print:text-black">
                     <Activity className="w-5 h-5 text-orange-500 print:hidden"/> Registro de Actividad Reciente
                  </h3>
                  <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar print:max-h-none print:overflow-visible">
                     {filteredActivity.length === 0 ? <p className="text-sm text-neutral-400">Sin actividad.</p> : 
                        filteredActivity.slice(0, 15).map((log, i) => (
                           <div key={i} className="flex gap-3 items-start text-sm border-b border-neutral-50 pb-2 last:border-0 print:border-gray-200">
                              <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.type==='USER'?'bg-blue-500':log.type==='BOOK'?'bg-green-500':'bg-orange-500'} print:hidden`}></span>
                              <div>
                                 <p className="text-neutral-700 font-medium print:text-black">{log.text}</p>
                                 <p className="text-xs text-neutral-400 print:text-gray-500">
                                    {new Date(log.date).toLocaleDateString()} • {log.user}
                                 </p>
                              </div>
                           </div>
                        ))
                     }
                  </div>
               </div>
            </div>

            {/* COLUMNA DERECHA: TABLA DE LIBROS */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-neutral-200 print:border-none print:shadow-none print:p-0 print:rounded-none">
               <h3 className="font-bold text-neutral-800 mb-6 flex items-center gap-2 print:mb-4 print:text-black print:text-lg">
                  <FileText className="w-5 h-5 text-gray-500 print:hidden"/> 
                  Listado de Libros
                  {filters.genre !== 'TODOS' && <span className="text-sm font-normal text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full ml-2 print:text-black print:border print:border-black print:bg-transparent">Filtro: {filters.genre}</span>}
               </h3>
               
               <div className="overflow-x-auto print:overflow-visible">
                  <table className="w-full text-sm text-left print:text-xs">
                     <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b print:bg-gray-100 print:text-black print:border-black">
                        <tr>
                           <th className="px-4 py-3 print:px-2 print:py-1">Título</th>
                           <th className="px-4 py-3 print:px-2 print:py-1">Género</th>
                           <th className="px-4 py-3 print:px-2 print:py-1">Subido por</th>
                           <th className="px-4 py-3 print:px-2 print:py-1">Fecha</th>
                        </tr>
                     </thead>
                     <tbody>
                        {filteredBooks.map((book, i) => (
                           <tr key={i} className="border-b last:border-0 hover:bg-neutral-50 print:border-gray-300">
                              <td className="px-4 py-3 font-medium text-neutral-800 print:text-black print:px-2 print:py-1">{book.titulo}</td>
                              <td className="px-4 py-3 text-neutral-600 print:text-black print:px-2 print:py-1">
                                {book.categorias || 'Sin categoría'}
                              </td>
                              <td className="px-4 py-3 text-primary-600 font-medium print:text-black print:px-2 print:py-1">{book.uploaderName}</td> 
                              <td className="px-4 py-3 text-neutral-500 print:text-black print:px-2 print:py-1">{new Date(book.createdAt).toLocaleDateString()}</td>
                           </tr>
                        ))}
                        {filteredBooks.length === 0 && (
                           <tr><td colSpan="4" className="px-4 py-8 text-center text-neutral-400">No hay libros con estos criterios</td></tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>

          </div>
          
          {/* FOOTER IMPRESIÓN */}
          <div className="hidden print:block mt-8 text-center text-xs text-gray-400 border-t pt-4">
             <p>Generado automáticamente por Book Club Admin System.</p>
          </div>

        </div>
      </div>
    </>
  );
}