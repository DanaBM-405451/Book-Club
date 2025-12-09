'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import Navbar from '@/components/layout/Navbar';
import api from '@/lib/api';
import { 
  Users, BookOpen, TrendingUp, Mail, Shield, Activity, Download, CheckCircle, FileText, Filter, Search, Calendar
} from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function AdminDashboardPage() {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  
  // Estados de Filtros
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    genre: 'TODOS',
    searchUser: '' // Filtro de texto para usuario
  });

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: { total: 0, active: 0 },
    books: { total: 0, reads: 0, list: [] },
    groups: { total: 0 }
  });
  
  const [activityLog, setActivityLog] = useState([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return router.push('/login');
    if (user?.role !== 'ADMIN') return router.push('/dashboard');
    
    // Cargar datos iniciales
    loadData();
    document.body.setAttribute('data-date', new Date().toLocaleDateString());
  }, [isAuthenticated, user]);

  // Función para aplicar filtros (botón "Filtrar")
  const handleFilter = () => {
    loadData();
    toast.success("Reporte actualizado");
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Construir Query Params
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.genre !== 'TODOS') params.append('genre', filters.genre);
      const queryString = params.toString();

      console.log("📥 Cargando reporte con filtros:", queryString);

      const [usersRes, booksRes, socialRes] = await Promise.allSettled([
        api.get(`/api/users/admin/stats?${queryString}`), // User Service (si implementaste filtros allí)
        api.get(`/api/library/books/admin/stats?${queryString}`), // Library Service (ya implementado)
        api.get(`/api/social/groups/admin/stats?${queryString}`) // Social Service
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
        let booksList = (d.latestBooks || []).map(b => ({
            ...b,
            uploaderName: 'Desconocido' // Valor temporal
        }));

        // Buscar nombres de usuarios para los libros
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
            } catch (e) { console.warn(e); }
        }

        newStats.books = { 
            total: d.totalBooks || 0, 
            reads: d.totalReads || 0, 
            list: booksList 
        };
        
        booksList.forEach(b => activities.push({
            type: 'BOOK', text: `Libro subido: "${b.titulo}" (${b.genero})`, date: b.createdAt, user: b.uploaderName
        }));
      }

      // Ordenar actividades
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

  // Filtrado CLIENT-SIDE para la tabla de actividad y libros (Usuario específico)
  const filteredActivity = activityLog.filter(item => {
      if (!filters.searchUser) return true;
      return item.user?.toLowerCase().includes(filters.searchUser.toLowerCase()) || 
             item.text?.toLowerCase().includes(filters.searchUser.toLowerCase());
  });

  const filteredBooks = stats.books.list.filter(book => {
      if (!filters.searchUser) return true;
      return book.uploaderName?.toLowerCase().includes(filters.searchUser.toLowerCase());
  });

  if (!user || user.role !== 'ADMIN') return null;

  return (
    <>
      <Toaster position="top-center" />
      <Navbar />

      <div className="ml-20 min-h-screen bg-[#f8f9fa] p-8 print:ml-0 print:p-0 print:bg-white">
        <div className="max-w-7xl mx-auto print:max-w-none">
          
          {/* HEADER DEL REPORTE */}
          <div className="flex justify-between items-end mb-6 print:mb-4 print:border-b-2 print:border-black print:pb-4">
            <div className="print:w-full print:text-center">
              <h1 className="text-3xl font-heading text-neutral-900 flex items-center gap-3 print:justify-center">
                <Shield className="w-8 h-8 text-primary-600 print:text-black" />
                Reporte de Control
              </h1>
              <p className="text-neutral-500 mt-1 font-ui print:text-black">
                {filters.startDate ? `Reporte del periodo: ${filters.startDate} al ${filters.endDate || 'Hoy'}` : 'Resumen histórico de la plataforma.'}
              </p>
            </div>
            <button onClick={() => window.print()} className="btn-outline flex items-center gap-2 text-sm print:hidden">
              <Download className="w-4 h-4" /> Exportar PDF
            </button>
          </div>

          {/* 🛠️ BARRA DE FILTROS (NO IMPRIMIBLE) */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 mb-8 flex flex-wrap gap-4 items-end print:hidden">
            
            {/* Fechas */}
            <div>
                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Desde</label>
                <input 
                    type="date" 
                    className="input-field py-2 text-sm" 
                    value={filters.startDate}
                    onChange={(e) => setFilters({...filters, startDate: e.target.value})}
                />
            </div>
            <div>
                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Hasta</label>
                <input 
                    type="date" 
                    className="input-field py-2 text-sm"
                    value={filters.endDate}
                    onChange={(e) => setFilters({...filters, endDate: e.target.value})}
                />
            </div>

           {/* Género */}
            <div>
                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Género / Categoría</label>
                <select 
                    className="input-field py-2 text-sm min-w-[150px]"
                    value={filters.genre}
                    onChange={(e) => setFilters({...filters, genre: e.target.value})}
                >
                    <option value="TODOS">Todos los géneros</option>
                    
                    {/* Categorías comunes de Google Books (Inglés) */}
                    <option value="Fiction">Ficción </option>
                    <option value="Fantasy">Fantasía </option>
                    <option value="Young Adult">Juvenil</option>
                    <option value="General">General</option>
                    <option value="Romance">Romance</option>
                    <option value="Thriller">Thriller / Suspense</option>
                    <option value="Science">Ciencia / Sci-Fi</option>
                    <option value="History">Historia</option>
                    <option value="Biography">Biografía</option>
                    <option value="Religion">Religion</option>
                    
                    {/* Categorías manuales (Español) - Si tienes */}
                    <option value="Romántica">Romántica</option>
                    <option value="Terror">Terror</option>
                    <option value="Aventura">Aventura</option>
                </select>
            </div>

            {/* Botón Aplicar Filtros Backend */}
            <button onClick={handleFilter} className="btn-primary py-2 px-4 text-sm flex items-center gap-2 h-[42px]">
                <Filter className="w-4 h-4" /> Aplicar Filtros
            </button>

            {/* Separador */}
            <div className="w-px h-10 bg-neutral-200 mx-2"></div>

            {/* Búsqueda de Usuario (Filtro Local) */}
            <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-neutral-500 uppercase mb-1 block">Buscar por Usuario</label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input 
                        type="text" 
                        placeholder="Ej: admin, juan..." 
                        className="input-field pl-9 py-2 text-sm w-full"
                        value={filters.searchUser}
                        onChange={(e) => setFilters({...filters, searchUser: e.target.value})}
                    />
                </div>
            </div>
          </div>

          {/* KPIS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 print:grid-cols-4 print:gap-4">
             <StatCard title="Total Usuarios" value={stats.users.total} icon={Users} color="blue" />
             <StatCard title="Libros (Filtrados)" value={stats.books.total} icon={BookOpen} color="green" />
             <StatCard title="Lecturas Finalizadas" value={stats.books.reads} icon={CheckCircle} color="purple" />
             <StatCard title="Total Grupos" value={stats.groups.total} icon={Activity} color="orange" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
            
            {/* COLUMNA IZQUIERDA: INVITAR + ACTIVIDAD */}
            <div className="lg:col-span-1 space-y-6">
               <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200 print:hidden">
                  <h3 className="font-bold mb-4 flex gap-2 items-center text-neutral-800"><Mail className="w-5 h-5 text-primary-500"/> Acciones Rápidas</h3>
                  <button className="btn-outline w-full text-sm mb-2" onClick={() => setFilters({ startDate: '', endDate: '', genre: 'TODOS', searchUser: '' }) || loadData()}>
                    Limpiar Filtros
                  </button>
                  {/* ... Formulario de invitación opcional ... */}
               </div>

               {/* LOG DE ACTIVIDAD */}
               <div className="bg-white rounded-xl shadow-sm p-6 border border-neutral-200 print:border-gray-300 print:shadow-none print:break-inside-avoid">
                  <h3 className="font-bold text-neutral-800 mb-4 flex items-center gap-2">
                     <Activity className="w-5 h-5 text-orange-500"/> Registro de Actividad
                  </h3>
                  <div className="space-y-4">
                     {filteredActivity.length === 0 ? <p className="text-sm text-neutral-400">Sin actividad en este periodo/usuario.</p> : 
                        filteredActivity.slice(0, 10).map((log, i) => (
                           <div key={i} className="flex gap-3 items-start text-sm border-b border-neutral-50 pb-2 last:border-0">
                              <span className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${log.type==='USER'?'bg-blue-500':log.type==='BOOK'?'bg-green-500':'bg-orange-500'}`}></span>
                              <div>
                                 <p className="text-neutral-700 font-medium">{log.text}</p>
                                 <p className="text-xs text-neutral-400">
                                    {new Date(log.date).toLocaleDateString()} • {log.user || 'Sistema'}
                                 </p>
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
                  <FileText className="w-5 h-5 text-gray-500"/> 
                  {filters.genre !== 'TODOS' ? `Libros de ${filters.genre}` : 'Últimos Libros Subidos'}
                  {filters.searchUser && <span className="text-sm font-normal text-neutral-500 ml-2">(Filtrado por: {filters.searchUser})</span>}
               </h3>
               
               <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                     <thead className="text-xs text-neutral-500 uppercase bg-neutral-50 border-b">
                        <tr>
                           <th className="px-4 py-3">Título</th>
                           <th className="px-4 py-3">Género</th>
                           <th className="px-4 py-3">Subido por</th>
                           <th className="px-4 py-3">Fecha</th>
                        </tr>
                     </thead>
                     <tbody>
                        {filteredBooks.map((book, i) => (
                           <tr key={i} className="border-b last:border-0 hover:bg-neutral-50">
                              <td className="px-4 py-3 font-medium text-neutral-800">{book.titulo}</td>
                              <td className="px-4 py-3 text-neutral-600">
                                <span className="bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded text-xs">{book.genero || 'General'}</span>
                              </td>
                              <td className="px-4 py-3 text-primary-600 font-medium">{book.uploaderName || 'Admin'}</td> 
                              <td className="px-4 py-3 text-neutral-500">{new Date(book.createdAt).toLocaleDateString()}</td>
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