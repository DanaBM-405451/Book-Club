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
} from 'lucide-react';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import Modal from '@/components/ui/Modal';
import Toggle from '@/components/ui/Toggle';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [profile, setProfile] = useState(null);
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

  // ✅ Avatares predefinidos
  const defaultAvatars = [
    'avatar_01.png',
    'avatar_02.png',
    'avatar_03.png',
    'avatar_04.png',
    'avatar_05.png',
    'avatar_06.png',
    'avatar_07.png',
    'avatar_08.png',
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
      const response = await api.get('/api/users/profile');
      
      const { profile: profileData, notificationSettings } = response.data.data;
      
      setProfile(profileData);
      
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
      console.error('Error loading profile:', error);
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
      // Actualizar privacidad
      await api.put('/api/users/profile', {
        isProfilePublic: newSettings.isPublic,
        showLibrary: newSettings.showLibrary,
        showStats: newSettings.showStats,
        showReadingActivity: newSettings.showReadingActivity,
      });
      
      // Actualizar notificaciones
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
      await api.put('/api/users/profile/avatar/default', { 
        avatarName 
      });
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

    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no debe superar los 5MB');
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append('avatar', file);

      await api.post('/api/users/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
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

  // ✅ Construir URL del avatar
  const getAvatarUrl = () => {
    if (profile?.avatarType === 'UPLOADED' && profile?.avatarUrl) {
      return profile.avatarUrl;
    }
    if (profile?.avatarType === 'DEFAULT' && profile?.defaultAvatar) {
      return `/avatars/${profile.defaultAvatar}`;
    }
    return '/avatars/avatar_01.png'; // Fallback
  };

  const fullName = [profile?.nombre, profile?.apellido].filter(Boolean).join(' ') || user?.username;

  return (
    <>
      <Toaster position="top-center" />

      <div className="min-h-screen bg-neutral-50">
        {/* Header */}
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
          {/* Profile Header */}
          <div className="card-vintage mb-6">
            {/* Cover */}
            <div className="h-32 bg-gradient-to-r from-primary-400 via-secondary-400 to-accent-400 rounded-t-lg -mx-6 -mt-6 mb-6" />

            {/* Avatar and Info */}
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center -mt-20 md:-mt-16">
              {/* Avatar */}
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-book overflow-hidden bg-neutral-200">
                  <img
                  src={getAvatarUrl()}
                    alt={fullName}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/avatars/avatar_01.png';
                    }}
                  />
                </div>
                <button
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-vintage hover:shadow-book transition-shadow"
                >
                  <Camera className="w-5 h-5 text-neutral-600" />
                </button>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-heading">{fullName}</h1>
                  
                </div>

                <p className="text-neutral-600 font-ui mb-4">
                  {profile?.bio || 'Aún no has agregado una biografía'}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-neutral-600 font-ui">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>@{user?.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      Miembro desde{' '}
                      {new Date(profile?.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                      })}
                    </span>
                  </div>
                  {profile?.favoriteGeneros && (
                    <div className="flex items-center gap-2">
                      <Book className="w-4 h-4" />
                      <span>{profile.favoriteGeneros}</span>
                    </div>
                  )}
                </div>

                {profile?.favoriteBookThisMonth && (
                  <div className="mt-3 flex items-center gap-2 text-sm">
                    <Heart className="w-4 h-4 text-primary-500" />
                    <span className="font-ui text-neutral-700">
                      Favorito del mes: <strong>{profile.favoriteBookThisMonth}</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="btn-primary flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Editar Perfil
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-6 py-3 font-ui font-medium rounded-lg transition-colors ${
                activeTab === 'info'
                  ? 'bg-primary-500 text-white shadow-vintage'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              Información
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 font-ui font-medium rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-primary-500 text-white shadow-vintage'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Configuración
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-6 py-3 font-ui font-medium rounded-lg transition-colors ${
                activeTab === 'security'
                  ? 'bg-primary-500 text-white shadow-vintage'
                  : 'bg-white text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Seguridad
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'info' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Reading Stats */}
              <div className="card-vintage">
                <h3 className="text-xl font-heading mb-4">📚 Estadísticas de Lectura</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                    <span className="font-ui text-neutral-700">Libros completados</span>
                    <span className="font-heading text-lg text-primary-600">
                      {profile?.totalBooksRead || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-neutral-200">
                    <span className="font-ui text-neutral-700">Páginas leídas</span>
                    <span className="font-heading text-lg text-secondary-600">
                      {profile?.totalPagesRead || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-ui text-neutral-700">Tiempo de lectura</span>
                    <span className="font-heading text-lg text-accent-600">
                      {Math.round((profile?.totalReadingTime || 0) / 60)} hrs
                    </span>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="card-vintage">
                <h3 className="text-xl font-heading mb-4">❤️ Preferencias</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-ui font-medium text-neutral-700 block mb-1">
                      Género favorito
                    </label>
                    <p className="text-neutral-900 font-ui">
                      {profile?.favoriteGeneros || 'No especificado'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-ui font-medium text-neutral-700 block mb-1">
                      Libro favorito del mes
                    </label>
                    <p className="text-neutral-900 font-ui">
                      {profile?.favoriteBookThisMonth || 'No especificado'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="grid md:grid-cols-2 gap-6">
              {/* Notifications */}
              <div className="card-vintage">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-accent-100 p-2 rounded-lg">
                    <Bell className="w-5 h-5 text-accent-600" />
                  </div>
                  <h2 className="text-xl font-heading">Notificaciones</h2>
                </div>

                <div className="space-y-4">
                  <Toggle
                    label="Nuevos seguidores"
                    enabled={settings.notifyFollowers}
                    onChange={(value) =>
                      handleUpdateSettings({ ...settings, notifyFollowers: value })
                    }
                  />
                  <Toggle
                    label="Comentarios en tus libros"
                    enabled={settings.notifyComments}
                    onChange={(value) =>
                      handleUpdateSettings({ ...settings, notifyComments: value })
                    }
                  />
                  <Toggle
                    label="Logros desbloqueados"
                    enabled={settings.notifyAchievements}
                    onChange={(value) =>
                      handleUpdateSettings({ ...settings, notifyAchievements: value })
                    }
                  />
                  <Toggle
                    label="Nuevos libros recomendados"
                    enabled={settings.notifyNewBooks}
                    onChange={(value) =>
                      handleUpdateSettings({ ...settings, notifyNewBooks: value })
                    }
                  />
                </div>
              </div>

              {/* Privacy */}
              <div className="card-vintage">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-secondary-100 p-2 rounded-lg">
                    <Globe className="w-5 h-5 text-secondary-600" />
                  </div>
                  <h2 className="text-xl font-heading">Privacidad</h2>
                </div>

                <div className="space-y-4">
                  <Toggle
                    label="Perfil público"
                    enabled={settings.isPublic}
                    onChange={(value) => handleUpdateSettings({ ...settings, isPublic: value })}
                  />
                  <Toggle
                    label="Mostrar mi biblioteca"
                    enabled={settings.showLibrary}
                    onChange={(value) => handleUpdateSettings({ ...settings, showLibrary: value })}
                  />
                  <Toggle
                    label="Mostrar estadísticas"
                    enabled={settings.showStats}
                    onChange={(value) => handleUpdateSettings({ ...settings, showStats: value })}
                  />
                  <Toggle
                    label="Mostrar actividad de lectura"
                    enabled={settings.showReadingActivity}
                    onChange={(value) =>
                      handleUpdateSettings({ ...settings, showReadingActivity: value })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card-vintage max-w-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <Lock className="w-5 h-5 text-primary-600" />
                </div>
                <h2 className="text-xl font-heading">Seguridad</h2>
              </div>

              <div className="space-y-4">
                <button className="btn-outline w-full justify-center">
                  Cambiar Contraseña
                </button>
                <button className="w-full justify-center px-6 py-3 font-ui font-medium rounded-lg border-2 border-red-300 text-red-600 hover:bg-red-50 transition-colors">
                  Eliminar Cuenta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Editar Perfil"
      >
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">Nombre</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="input-field"
                placeholder="Juan"
              />
            </div>

            <div>
              <label className="label-field">Apellido</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="input-field"
                placeholder="Pérez"
              />
            </div>
          </div>

          <div>
            <label className="label-field">Biografía</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="input-field"
              rows={4}
              placeholder="Cuéntanos sobre ti..."
            />
          </div>

          <div>
            <label className="label-field">Género Favorito</label>
            <input
              type="text"
              value={formData.favoriteGeneros}
              onChange={(e) => setFormData({ ...formData, favoriteGeneros: e.target.value })}
              className="input-field"
              placeholder="Ej: Ciencia Ficción, Fantasía..."
            />
          </div>

          <div>
            <label className="label-field">Libro Favorito del Mes</label>
            <input
              type="text"
              value={formData.favoriteBookThisMonth}
              onChange={(e) =>
                setFormData({ ...formData, favoriteBookThisMonth: e.target.value })
              }
              className="input-field"
              placeholder="Ej: El Quijote"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="btn-outline"
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              Guardar Cambios
            </button>
          </div>
        </form>
      </Modal>

      {/* Change Avatar Modal */}
      <Modal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        title="Cambiar Avatar"
      >
        <div className="space-y-6">
          {/* Upload Image */}
          <div>
            <label className="label-field mb-3">Subir tu propia imagen</label>
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                id="avatar-upload"
                disabled={uploadingImage}
              />
              <label
                htmlFor="avatar-upload"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                {uploadingImage ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
                    <p className="text-sm text-neutral-600 font-ui">Subiendo imagen...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-neutral-400" />
                    <p className="text-sm text-neutral-600 font-ui">
                      Haz clic para subir una imagen
                    </p>
                    <p className="text-xs text-neutral-500">PNG, JPG (máx. 5MB)</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Predefined Avatars */}
          <div>
            <label className="label-field mb-3">O elige un avatar predefinido</label>
            <div className="grid grid-cols-4 gap-4">
              {defaultAvatars.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => handleAvatarChange(avatar)}
                  className="aspect-square rounded-full overflow-hidden border-2 border-neutral-200 hover:border-primary-500 hover:shadow-vintage transition-all"
                >
                  <img
                    src={`/avatars/${avatar}`}
                    alt={`Avatar ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = '/avatars/avatar_01.png';
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
