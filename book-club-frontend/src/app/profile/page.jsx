'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import {
  BookOpen,
  User,
  Mail,
  Calendar,
  Edit2,
  Camera,
  ArrowLeft,
  Save,
  Bell,
  Lock,
  Globe,
  Book,
  Heart,
  Settings,
  Upload,
  Flame, // Icono para la racha
  Trophy // Icono para el récord
} from 'lucide-react';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Toggle from '@/components/ui/Toggle';

// ✅ COMPONENTE HEATMAP (Cuadrícula de actividad)
const ActivityHeatmap = ({ activities = [] }) => {
    // Generar últimos 365 días
    const generateDays = () => {
      const days = [];
      const today = new Date();
      for (let i = 364; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        days.push(d);
      }
      return days;
    };
  
    const days = generateDays();
  
    // Mapa rápido de fechas activas
    const activityMap = {};
    activities.forEach(act => {
      const dateStr = new Date(act.date).toISOString().split('T')[0];
      activityMap[dateStr] = act.count;
    });
  
    const getColor = (count) => {
      if (!count) return 'bg-neutral-200'; // Gris suave para inactividad
      if (count === 1) return 'bg-green-300';
      if (count <= 3) return 'bg-green-400';
      if (count <= 5) return 'bg-green-500';
      return 'bg-green-600';
    };
  
    return (
      <div className="w-full overflow-hidden">
        <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
          {days.map((date, i) => {
            const dateStr = date.toISOString().split('T')[0];
            const count = activityMap[dateStr];
            return (
              <div
                key={i}
                title={`${dateStr}: ${count || 0} actividades`}
                className={`w-3 h-3 rounded-sm ${getColor(count)}`}
              />
            );
          })}
        </div>
        <div className="flex justify-end items-center gap-2 mt-2 text-xs text-neutral-400 font-ui">
          <span>Menos</span>
          <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-neutral-200"></div>
              <div className="w-3 h-3 rounded-sm bg-green-300"></div>
              <div className="w-3 h-3 rounded-sm bg-green-500"></div>
              <div className="w-3 h-3 rounded-sm bg-green-600"></div>
          </div>
          <span>Más</span>
        </div>
      </div>
    );
  };

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [formData, setFormData] = useState({
    nombre: '',
    apellido:  '',
    bio: '',
    favoriteGeneros: '',
    favoriteBookThisMonth: '',
  });

  const [settings, setSettings] = useState({
    notifyFollowers: true,
    notifyComments: true,
    notifyAchievements: true,
    notifyNewBooks: true,
    isPublic: true,
    showLibrary: true,
    showStats: true,
    showReadingActivity: true,
  });

  const defaultAvatars = [
    'avatar_01.png', 'avatar_02.png', 'avatar_03.png', 'avatar_04.png',
    'avatar_05.png', 'avatar_06.png', 'avatar_07.png', 'avatar_08.png',
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated, router]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      // 1. Loguear actividad de visita (Heartbeat)
      // Esto asegura que si entras al perfil, cuenta como actividad mínima
      await api.post('/api/users/activity').catch(() => {});

      const [profileResponse, statsResponse] = await Promise.all([
        api.get('/api/users/profile'),
        api.get('/api/gamification/stats').catch(() => ({ data: { data: { stats: null } } })) 
      ]);
      
      const { profile: profileData, notificationSettings } = profileResponse.data.data;
      const gamificationStats = statsResponse.data?.data?.stats || null;

      setProfile(profileData);
      setStats(gamificationStats);
      
      setFormData({
        nombre: profileData.nombre || '',
        apellido: profileData.apellido || '',
        bio: profileData.bio || '',
        favoriteGeneros: profileData.favoriteGeneros || '',
        favoriteBookThisMonth: profileData.favoriteBookThisMonth || '',
      });
      
      setSettings({
        notifyFollowers: notificationSettings?.friendRequests ?? true,
        notifyComments: notificationSettings?.newMessages ?? true,
        notifyAchievements: notificationSettings?.achievements ?? true,
        notifyNewBooks: notificationSettings?.readingReminders ?? true,
        isPublic: profileData.isProfilePublic ?? true,
        showLibrary: profileData.showLibrary ?? true,
        showStats: profileData.showStats ?? true,
        showReadingActivity: profileData.showReadingActivity ?? true,
      });
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put('/api/users/profile', {
        nombre: formData.nombre,
        apellido: formData.apellido,
        bio: formData.bio,
        favoriteGeneros: formData.favoriteGeneros,
        favoriteBookThisMonth: formData.favoriteBookThisMonth,
      });
      
      toast.success('✅ Perfil actualizado correctamente');
      setIsEditModalOpen(false);
      loadProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar perfil');
    }
  };

  const handleUpdateSettings = async (newSettings) => {
    try {
      await api.put('/api/users/profile', {
        isProfilePublic: newSettings.isPublic,
        showLibrary: newSettings.showLibrary,
        showStats: newSettings.showStats,
        showReadingActivity: newSettings.showReadingActivity,
      });
      
      await api.put('/api/users/notifications/settings', {
        friendRequests: newSettings.notifyFollowers,
        newMessages: newSettings.notifyComments,
        achievements: newSettings.notifyAchievements,
        readingReminders: newSettings.notifyNewBooks,
      });
      
      toast.success('✅ Configuración guardada');
      setSettings(newSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Error al guardar configuración');
    }
  };

  const handleAvatarChange = async (avatarName) => {
    try {
      await api.put('/api/users/profile/avatar/default', { avatarName });
      toast.success('✅ Avatar actualizado');
      setIsAvatarModalOpen(false);
      loadProfile();
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error(error.response?.data?.message || 'Error al actualizar avatar');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('avatar', file);
      await api.post('/api/users/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      toast.success('✅ Foto actualizada');
      setIsAvatarModalOpen(false);
      loadProfile();
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error(error.response?.data?.message || 'Error al subir la imagen');
    } finally {
      setUploadingImage(false);
    }
  };

  if (!isAuthenticated) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-neutral-600 font-ui">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  const getAvatarUrl = () => {
    if (profile?.avatarType === 'UPLOADED' && profile?.avatarUrl) {
      return profile.avatarUrl;
    }
    if (profile?.avatarType === 'DEFAULT' && profile?.defaultAvatar) {
      return `/avatars/${profile.defaultAvatar}`;
    }
    return '/avatars/avatar_01.png'; 
  };

  const fullName = [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') || user?.username;

  return (
    <>
      <Toaster position="top-center" />

      <div className="min-h-screen bg-neutral-50">
        <header className="bg-white shadow-card border-b border-neutral-200">
          <div className="max-w-6xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-2 text-neutral-600 hover:text-primary-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-ui">Volver al Dashboard</span>
            </button>
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="card-vintage mb-6 bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
            {/* Portada */}
            <div className="h-32 bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400" />

            <div className="px-6 pb-6">
              <div className="flex flex-col md:flex-row gap-6 items-start -mt-12">
                
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-32 h-32 rounded-full border-4 border-white shadow-md overflow-hidden bg-neutral-200">
                    <img
                      src={getAvatarUrl()}
                      alt={fullName}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/avatars/avatar_01.png'; }}
                    />
                  </div>
                  <button
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="absolute bottom-1 right-1 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow border border-neutral-100"
                    title="Cambiar foto"
                  >
                    <Camera className="w-4 h-4 text-neutral-600" />
                  </button>
                </div>

                {/* Info del Usuario */}
                <div className="flex-1 w-full pt-14 md:pt-16"> {/* Ajuste de padding para alinear con la parte blanca */}
                  
                  {/* FILA 1: Nombre + Stats + Botón Editar */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                    
                    {/* Nombre y Badges en la misma línea */}
                    <div className="flex flex-wrap items-center gap-4">
                        <h1 className="text-3xl font-heading text-neutral-900">{fullName}</h1>
                        
                        {/* Badges de Racha */}
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 text-orange-600 rounded-full border border-orange-100" title="Racha actual">
                                <Flame className="w-4 h-4 fill-orange-500" />
                                <span className="font-bold text-sm">{profile?.currentStreak || 0}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-yellow-50 text-yellow-600 rounded-full border border-yellow-100" title="Récord histórico">
                                <Trophy className="w-4 h-4 fill-yellow-500" />
                                <span className="font-bold text-sm">{profile?.longestStreak || 0}</span>
                            </div>
                        </div>
                    </div>

                    {/* Botón Editar (A la derecha) */}
                    <button onClick={() => setIsEditModalOpen(true)} className="btn-outline text-sm py-1.5 px-4 flex items-center gap-2 self-start md:self-auto">
                        <Edit2 className="w-4 h-4" /> Editar
                    </button>
                  </div>

                  {/* FILA 2: Biografía */}
                  <p className="text-neutral-600 font-ui mb-3 text-sm md:text-base max-w-3xl">
                    {profile?.bio || 'Aún no has agregado una biografía...'}
                  </p>

                  {/* FILA 3: Metadata (Usuario, Email, Fecha) */}
                  <div className="flex flex-wrap gap-4 text-sm text-neutral-500 font-ui border-t border-neutral-100 pt-3 mt-1">
                    <div className="flex items-center gap-1.5">
                      <User className="w-4 h-4" />
                      <span>@{user?.username}</span>
                    </div>
                    <div className="hidden sm:block text-neutral-300">•</div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-4 h-4" />
                      <span>{user?.email}</span>
                    </div>
                    <div className="hidden sm:block text-neutral-300">•</div>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Miembro desde {new Date(profile?.createdAt).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            <button onClick={() => setActiveTab('info')} className={`px-6 py-3 font-ui font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === 'info' ? 'bg-primary-500 text-white shadow-vintage' : 'bg-white text-neutral-600 hover:bg-neutral-100'}`}>
              <User className="w-4 h-4 inline mr-2" /> Información
            </button>
            <button onClick={() => setActiveTab('settings')} className={`px-6 py-3 font-ui font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === 'settings' ? 'bg-primary-500 text-white shadow-vintage' : 'bg-white text-neutral-600 hover:bg-neutral-100'}`}>
              <Settings className="w-4 h-4 inline mr-2" /> Configuración
            </button>
            <button onClick={() => setActiveTab('security')} className={`px-6 py-3 font-ui font-medium rounded-lg transition-colors whitespace-nowrap ${activeTab === 'security' ? 'bg-primary-500 text-white shadow-vintage' : 'bg-white text-neutral-600 hover:bg-neutral-100'}`}>
              <Lock className="w-4 h-4 inline mr-2" /> Seguridad
            </button>
          </div>

          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Columna Izquierda: Stats Numéricas */}
              <div className="space-y-6">
                 <div className="card-vintage">
                    <h3 className="text-xl font-heading mb-4">Estadísticas</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                            <span className="font-ui text-neutral-700">Libros completados</span>
                            <span className="font-heading text-lg text-primary-600">{stats?.totalBooksRead || profile?.totalBooksRead || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                            <span className="font-ui text-neutral-700">Páginas leídas</span>
                            <span className="font-heading text-lg text-secondary-600">{stats?.totalPagesRead || profile?.totalPagesRead || 0}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="font-ui text-neutral-700">Tiempo de lectura</span>
                            <span className="font-heading text-lg text-accent-600">{Math.round((stats?.totalReadingTime || profile?.totalReadingTime || 0) / 60)} hrs</span>
                        </div>
                    </div>
                 </div>

                 <div className="card-vintage">
                    <h3 className="text-xl font-heading mb-4">❤️ Favoritos</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-1">Género favorito</label>
                            <p className="text-neutral-900 font-ui">{profile?.favoriteGeneros || 'No especificado'}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-neutral-500 uppercase tracking-wide block mb-1">Libro del mes</label>
                            <p className="text-neutral-900 font-ui">{profile?.favoriteBookThisMonth || 'No especificado'}</p>
                        </div>
                    </div>
                 </div>
              </div>

              {/* ✅ COLUMNA DERECHA: CALENDARIO DE ACTIVIDAD */}
              <div className="lg:col-span-2">
                 <div className="card-vintage h-full">
                    <h3 className="text-xl font-heading mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-primary-500" />
                        Actividad de Lectura
                    </h3>
                    <div className="p-4 border border-neutral-200 rounded-xl bg-white mb-4">
                        {/* Aquí va el componente Heatmap */}
                        <ActivityHeatmap activities={profile?.activities || []} />
                    </div>
                    <div className="flex gap-6 justify-center md:justify-start">
                         <div className="text-center md:text-left">
                            <span className="block text-2xl font-bold text-neutral-800">{profile?.activities?.length || 0}</span>
                            <span className="text-xs text-neutral-500 uppercase">Días activos (año)</span>
                         </div>
                         <div className="text-center md:text-left">
                             {/* Puedes agregar más métricas aquí si quieres */}
                         </div>
                    </div>
                 </div>
              </div>

            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="card-vintage">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-accent-100 p-2 rounded-lg"><Bell className="w-5 h-5 text-accent-600" /></div>
                  <h2 className="text-xl font-heading">Notificaciones</h2>
                </div>
                <div className="space-y-4">
                  <Toggle label="Nuevos seguidores" enabled={settings.notifyFollowers} onChange={(val) => handleUpdateSettings({ ...settings, notifyFollowers: val })} />
                  <Toggle label="Comentarios" enabled={settings.notifyComments} onChange={(val) => handleUpdateSettings({ ...settings, notifyComments: val })} />
                  <Toggle label="Logros" enabled={settings.notifyAchievements} onChange={(val) => handleUpdateSettings({ ...settings, notifyAchievements: val })} />
                </div>
              </div>
              <div className="card-vintage">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-secondary-100 p-2 rounded-lg"><Globe className="w-5 h-5 text-secondary-600" /></div>
                  <h2 className="text-xl font-heading">Privacidad</h2>
                </div>
                <div className="space-y-4">
                  <Toggle label="Perfil público" enabled={settings.isPublic} onChange={(val) => handleUpdateSettings({ ...settings, isPublic: val })} />
                  <Toggle label="Mostrar biblioteca" enabled={settings.showLibrary} onChange={(val) => handleUpdateSettings({ ...settings, showLibrary: val })} />
                  <Toggle label="Mostrar actividad" enabled={settings.showReadingActivity} onChange={(val) => handleUpdateSettings({ ...settings, showReadingActivity: val })} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
             <div className="card-vintage max-w-2xl mx-auto">
                 {/* ... (Contenido de seguridad igual) ... */}
                 <div className="flex items-center gap-3 mb-6">
                    <div className="bg-primary-100 p-2 rounded-lg"><Lock className="w-5 h-5 text-primary-600" /></div>
                    <h2 className="text-xl font-heading">Seguridad</h2>
                 </div>
                 <div className="space-y-4">
                    <button className="btn-outline w-full justify-center">Cambiar Contraseña</button>
                    <button className="w-full justify-center px-6 py-3 font-ui font-medium rounded-lg border-2 border-red-300 text-red-600 hover:bg-red-50 transition-colors">Eliminar Cuenta</button>
                 </div>
             </div>
          )}
        </div>
      </div>

      {/* Modals siguen igual ... */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Editar Perfil">
        <form onSubmit={handleUpdateProfile} className="space-y-4">
             {/* ... campos del formulario ... */}
             <div className="grid md:grid-cols-2 gap-4">
                <div><label className="label-field">Nombre</label><input type="text" value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})} className="input-field" /></div>
                <div><label className="label-field">Apellido</label><input type="text" value={formData.apellido} onChange={(e) => setFormData({...formData, apellido: e.target.value})} className="input-field" /></div>
             </div>
             <div><label className="label-field">Biografía</label><textarea value={formData.bio} onChange={(e) => setFormData({...formData, bio: e.target.value})} className="input-field" rows={4} /></div>
             <div><label className="label-field">Género Favorito</label><input type="text" value={formData.favoriteGeneros} onChange={(e) => setFormData({...formData, favoriteGeneros: e.target.value})} className="input-field" /></div>
             <div><label className="label-field">Libro Favorito del Mes</label><input type="text" value={formData.favoriteBookThisMonth} onChange={(e) => setFormData({...formData, favoriteBookThisMonth: e.target.value})} className="input-field" /></div>
             <div className="flex gap-3 justify-end pt-4">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="btn-outline">Cancelar</button>
                <button type="submit" className="btn-primary flex items-center gap-2"><Save className="w-4 h-4"/> Guardar Cambios</button>
             </div>
        </form>
      </Modal>

      <Modal isOpen={isAvatarModalOpen} onClose={() => setIsAvatarModalOpen(false)} title="Cambiar Avatar">
         {/* ... contenido del modal de avatar ... */}
         <div className="space-y-6">
            <div>
                <label className="label-field mb-3">Subir tu propia imagen</label>
                <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="avatar-upload" disabled={uploadingImage} />
                    <label htmlFor="avatar-upload" className="cursor-pointer flex flex-col items-center gap-2">
                        {uploadingImage ? <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div> : <><Upload className="w-12 h-12 text-neutral-400"/><p className="text-sm text-neutral-600 font-ui">Haz clic para subir una imagen</p></>}
                    </label>
                </div>
            </div>
            <div>
                <label className="label-field mb-3">O elige un avatar predefinido</label>
                <div className="grid grid-cols-4 gap-4">
                    {defaultAvatars.map((avatar, index) => (
                        <button key={index} onClick={() => handleAvatarChange(avatar)} className="aspect-square rounded-full overflow-hidden border-2 border-neutral-200 hover:border-primary-500 hover:shadow-vintage transition-all">
                            <img src={`/avatars/${avatar}`} alt={`Avatar ${index + 1}`} className="w-full h-full object-cover" onError={(e) => { e.target.src = '/avatars/avatar_01.png'; }} />
                        </button>
                    ))}
                </div>
            </div>
         </div>
      </Modal>
    </>
  );
}