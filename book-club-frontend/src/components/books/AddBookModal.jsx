// src/components/books/AddBookModal.jsx

'use client';

import { useState, useEffect } from 'react';
import { X, Search, Upload, BookOpen, Loader2, Plus, Info, ChevronUp, ChevronDown } from 'lucide-react';
import axios from 'axios';
import api, { uploadBook } from '@/lib/api';
import toast from 'react-hot-toast';

const SHELVES = [
  { value: 'QUIERO_LEER', label: 'Quiero leer', color: 'bg-blue-100 text-blue-700' },
  { value: 'LEYENDO', label: 'Leyendo', color: 'bg-green-100 text-green-700' },
  { value: 'COMPLETADO', label: 'Completado', color: 'bg-purple-100 text-purple-700' },
  { value: 'EN_ESPERA', label: 'En espera', color: 'bg-yellow-100 text-yellow-700' },
  { value: 'ABANDONADO', label: 'Abandonado', color: 'bg-red-100 text-red-700' },
];

// Función para mejorar la calidad de la portada de Google
const getHighResCover = (url) => {
  if (!url) return null;
  let cleanUrl = url.replace('http:', 'https:').replace('&edge=curl', '');
  cleanUrl = cleanUrl.replace(/&zoom=\d/, '');
  return `${cleanUrl}&w=1000`;
  // 1. Forzar HTTPS
  // 2. Quitar el efecto de página doblada (&edge=curl)
  // 3. Cambiar zoom=1 (thumbnail) a zoom=0 (máxima resolución disponible)
  //return url.replace('http:', 'https:').replace('&edge=curl', '').replace('&zoom=1', '&zoom=0'); 
};

// ✅ Helper para obtener token desde auth-storage
const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  
  const storage = localStorage.getItem('auth-storage');
  if (!storage) return null;
  
  try {
    const { state } = JSON.parse(storage);
    return state?.accessToken || null;
  } catch (error) {
    console.error('Error parsing auth storage:', error);
    return null;
  }
};

export default function AddBookModal({ isOpen, onClose, onBookAdded }) {
  const [activeTab, setActiveTab] = useState('manual');
  const [selectedShelf, setSelectedShelf] = useState('QUIERO_LEER');
  const [loading, setLoading] = useState(false);

  // Manual
  const [manualData, setManualData] = useState({
    titulo: '',
    autor: '',
    subtitulo: '',
    descripcion: '',
    pageCount: '',
    categorias: '',
    isbn13: '',
    isbn10: '',
    coverImageUrl: '',
    publicacion: '',
    fechaPublicacion: '',
    idioma: 'es',
  });

  // Google Books
  const [googleQuery, setGoogleQuery] = useState('');
  const [googleResults, setGoogleResults] = useState([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedGoogleBook, setSelectedGoogleBook] = useState(null);

  // Upload
  const [uploadData, setUploadData] = useState({
    titulo: '',
    autor: '',
    descripcion: '',
    pageCount: '',
    cover: null,
    pdf: null,
    epub: null,
  });

  useEffect(() => {
    if (isOpen) {
      // Reset al abrir
      setActiveTab('manual');
      setSelectedShelf('QUIERO_LEER');
      setManualData({
        titulo: '',
        autor: '',
        subtitulo: '',
        descripcion: '',
        pageCount: '',
        categorias: '',
        isbn13: '',
        isbn10: '',
        coverImageUrl: '',
        publicacion: '',
        fechaPublicacion: '',
        idioma: 'es',
      });
      setGoogleQuery('');
      setGoogleResults([]);
      setSelectedGoogleBook(null);
      setUploadData({
        titulo: '',
        autor: '',
        descripcion: '',
        pageCount: '',
        cover: null,
        pdf: null,
        epub: null,
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    onClose();
  };

  // Buscar en Google Books
  const handleGoogleSearch = async (e) => {
    e.preventDefault();

    if (!googleQuery.trim()) {
      toast.error('Ingresa un título o autor');
      return;
    }

    try {
      setGoogleLoading(true);
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(
          googleQuery
        )}&maxResults=20&langRestrict=es`
      );

      if (response.data.items && response.data.items.length > 0) {
        setGoogleResults(response.data.items);
      } else {
        setGoogleResults([]);
        toast.error('No se encontraron libros');
      }
    } catch (error) {
      console.error('Error searching Google Books:', error);
      toast.error('Error al buscar libros');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Agregar libro

const handleAddBook = async () => {
  try {
    setLoading(true);

    if (activeTab === 'manual') {
      // ✅ MANUAL
      if (!manualData.titulo?.trim()) {
        toast.error('El título es requerido');
        return;
      }
      if (!manualData.autor?.trim()) {
        toast.error('El autor es requerido');
        return;
      }

      const payload = {
        titulo: manualData.titulo.trim(),
        autor: manualData.autor.trim(),
        subtitulo: manualData.subtitulo?.trim() || null,
        descripcion: manualData.descripcion?.trim() || null,
        pageCount: manualData.pageCount ? parseInt(manualData.pageCount) : null,
        categorias: manualData.categorias?.trim() || null,
        idioma: manualData.idioma || 'es',
        isbn10: manualData.isbn10?.trim() || null,
        isbn13: manualData.isbn13?.trim() || null,
        coverImageUrl: manualData.coverImageUrl?.trim() || null,
        publicacion: manualData.publicacion?.trim() || null,
        fechaPublicacion: manualData.fechaPublicacion || null,
        source: 'MANUAL', // ✅ Correcto
        shelf: selectedShelf,
      };

      console.log('🚀 Sending manual book:', payload);

      await api.post('/api/library/books', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      toast.success('¡Libro agregado exitosamente!');
    } else if (activeTab === 'google') {
      // ✅ GOOGLE BOOKS
      if (!selectedGoogleBook) {
        toast.error('Selecciona un libro de Google');
        return;
      }

      const info = selectedGoogleBook.volumeInfo;
      const volumeInfo = selectedGoogleBook.volumeInfo;

      const highResImage = getHighResCover(info.imageLinks?.thumbnail);

      const payload = {
        titulo: volumeInfo.title,
        subtitulo: volumeInfo.subtitle || null,
        autor: volumeInfo.authors?.join(', ') || 'Autor desconocido',
        descripcion: volumeInfo.description || null,
        pageCount: volumeInfo.pageCount || null,
        categorias: volumeInfo.categories?.join(', ') || null,
        idioma: volumeInfo.language || 'es',
        isbn10:
          volumeInfo.industryIdentifiers?.find((id) => id.type === 'ISBN_10')
            ?.identifier || null,
        isbn13:
          volumeInfo.industryIdentifiers?.find((id) => id.type === 'ISBN_13')
            ?.identifier || null,
        coverImageUrl:
          volumeInfo.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
        publicacion: volumeInfo.publisher || null,
        fechaPublicacion: volumeInfo.publishedDate || null,
        source: 'GOOGLE_BOOKS', 
        googleBookId: selectedGoogleBook.id,
        shelf: selectedShelf,
      };

      console.log('🚀 Sending Google Books payload:', payload);

      await api.post('/api/library/books', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      toast.success('¡Libro agregado desde Google Books!');
    } else if (activeTab === 'upload') {
      // ✅ UPLOAD: Determinar source según el tipo de archivo
      /*if (!uploadData.titulo?.trim()) {
        toast.error('El título es requerido');
        return;
      }
      if (!uploadData.autor?.trim()) {
        toast.error('El autor es requerido');
        return;
      }*/
      if (!uploadData.pdf && !uploadData.epub) {
        toast.error('Debes subir un archivo PDF o EPUB');
        return;
      }

      const token = getAuthToken();
      if (!token) {
        toast.error('No estás autenticado. Inicia sesión nuevamente.');
        return;
      }

      const formData = new FormData();

      //formData.append('titulo', uploadData.titulo.trim());
      //formData.append('autor', uploadData.autor.trim());
      formData.append('titulo', uploadData.titulo ? uploadData.titulo.trim() : '');
  formData.append('autor', uploadData.autor ? uploadData.autor.trim() : '');
      
      // ✅ IMPORTANTE: Usar 'PDF' o 'EPUB' según el archivo subido
      if (uploadData.pdf) {
        formData.append('source', 'PDF');
      } else if (uploadData.epub) {
        formData.append('source', 'EPUB');
      }
      
      formData.append('shelf', selectedShelf);

      if (uploadData.descripcion) {
        formData.append('descripcion', uploadData.descripcion.trim());
      }
      if (uploadData.pageCount) {
        formData.append('pageCount', uploadData.pageCount);
      }
      if (uploadData.cover) {
        formData.append('cover', uploadData.cover);
      }
      if (uploadData.pdf) {
        formData.append('pdf', uploadData.pdf);
      }
      if (uploadData.epub) {
        formData.append('epub', uploadData.epub);
      }

      console.log('📤 Uploading book with files');

      await uploadBook(formData);

      toast.success('¡Libro subido exitosamente!');
    }

    // Recargar libros y cerrar modal
    if (onBookAdded) {
      await onBookAdded();
    }
    handleClose();
  } catch (error) {
    console.error('❌ Error adding book:', error);
    
    if (error.response?.status === 401) {
      toast.error('Tu sesión expiró. Por favor inicia sesión nuevamente.');
    } else {
      toast.error(error.response?.data?.message || 'Error al agregar el libro');
    }
  } finally {
    setLoading(false);
  }
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-2xl shadow-card max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200">
          <h2 className="text-2xl font-heading">Agregar Libro</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 px-6">
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-6 py-3 font-ui font-medium transition-colors ${
              activeTab === 'manual'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Plus className="w-5 h-5 inline mr-2" />
            Manual
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`px-6 py-3 font-ui font-medium transition-colors ${
              activeTab === 'google'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Search className="w-5 h-5 inline mr-2" />
            Google Books
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-3 font-ui font-medium transition-colors ${
              activeTab === 'upload'
                ? 'text-primary-600 border-b-2 border-primary-600'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Upload className="w-5 h-5 inline mr-2" />
            Subir Archivo
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Manual Tab */}
          {activeTab === 'manual' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                {/* Título */}
                <div>
                  <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
                    Título *
                  </label>
                  <input
                    type="text"
                    value={manualData.titulo}
                    onChange={(e) =>
                      setManualData({ ...manualData, titulo: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                    placeholder="El Quijote"
                    required
                  />
                </div>

                {/* Autor */}
                <div>
                  <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
                    Autor *
                  </label>
                  <input
                    type="text"
                    value={manualData.autor}
                    onChange={(e) =>
                      setManualData({ ...manualData, autor: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                    placeholder="Miguel de Cervantes"
                    required
                  />
                </div>

                {/* Subtítulo */}
                <div>
                  <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
                    Subtítulo
                  </label>
                  <input
                    type="text"
                    value={manualData.subtitulo}
                    onChange={(e) =>
                      setManualData({ ...manualData, subtitulo: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                    placeholder="Subtítulo (opcional)"
                  />
                </div>

                {/* Páginas */}
                <div>
                  <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
                    Páginas
                  </label>
                  <input
                    type="number"
                    value={manualData.pageCount}
                    onChange={(e) =>
                      setManualData({ ...manualData, pageCount: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                    placeholder="863"
                    min="0"
                  />
                </div>

                {/* ISBN-13 */}
                <div>
                  <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
                    ISBN-13
                  </label>
                  <input
                    type="text"
                    value={manualData.isbn13}
                    onChange={(e) =>
                      setManualData({ ...manualData, isbn13: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                    placeholder="9788491050483"
                  />
                </div>

                {/* ISBN-10 */}
                <div>
                  <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
                    ISBN-10
                  </label>
                  <input
                    type="text"
                    value={manualData.isbn10}
                    onChange={(e) =>
                      setManualData({ ...manualData, isbn10: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                    placeholder="8491050483"
                  />
                </div>

                {/* Editorial */}
                <div>
                  <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
                    Editorial
                  </label>
                  <input
                    type="text"
                    value={manualData.publicacion}
                    onChange={(e) =>
                      setManualData({ ...manualData, publicacion: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                    placeholder="Penguin Random House"
                  />
                </div>

                {/* Idioma */}
                <div>
                  <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
                    Idioma
                  </label>
                  <select
                    value={manualData.idioma}
                    onChange={(e) =>
                      setManualData({ ...manualData, idioma: e.target.value })
                    }
                    className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                  >
                    <option value="es">Español</option>
                    <option value="en">Inglés</option>
                    <option value="fr">Francés</option>
                    <option value="de">Alemán</option>
                    <option value="pt">Portugués</option>
                  </select>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={manualData.descripcion}
                  onChange={(e) =>
                    setManualData({ ...manualData, descripcion: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                  rows="4"
                  placeholder="Escribe una breve descripción del libro..."
                />
              </div>

              {/* Categorías */}
              <div>
                <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
                  Categorías
                </label>
                <input
                  type="text"
                  value={manualData.categorias}
                  onChange={(e) =>
                    setManualData({ ...manualData, categorias: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                  placeholder="Ficción, Clásico, Aventura"
                />
              </div>

              {/* URL de Portada */}
              <div>
                <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
                  URL de Portada (opcional)
                </label>
                <input
                  type="url"
                  value={manualData.coverImageUrl}
                  onChange={(e) =>
                    setManualData({ ...manualData, coverImageUrl: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                  placeholder="https://ejemplo.com/portada.jpg"
                />
              </div>
            </div>
          )}

          {/* --- GOOGLE BOOKS TAB (MEJORADO) --- */}
          {activeTab === 'google' && (
            <div className="space-y-6">
              <form onSubmit={handleGoogleSearch} className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                    <input
                    type="text"
                    value={googleQuery}
                    onChange={(e) => setGoogleQuery(e.target.value)}
                    placeholder="Buscar por título, autor o ISBN..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl font-ui focus:border-primary-500 focus:outline-none transition-colors"
                    />
                </div>
                <button type="submit" disabled={googleLoading} className="btn-primary px-6 rounded-xl">
                  {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Buscar'}
                </button>
              </form>

              {googleResults.length > 0 && (
                <div className="grid gap-4">
                  {googleResults.map((book) => {
                    const info = book.volumeInfo;
                    const isSelected = selectedGoogleBook?.id === book.id;
                    const highResThumb = getHighResCover(info.imageLinks?.thumbnail);

                    return (
                      <div
                        key={book.id}
                        onClick={() => setSelectedGoogleBook(isSelected ? null : book)}
                        className={`group relative rounded-xl border-2 transition-all cursor-pointer overflow-hidden ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 shadow-md'
                            : 'border-neutral-100 hover:border-primary-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex p-4 gap-4">
                            {/* Portada */}
                            <div className="flex-shrink-0">
                                {info.imageLinks?.thumbnail ? (
                                    <img
                                    // Usamos la imagen mejorada si está seleccionado, sino la normal para la lista
                                    src={isSelected ? highResThumb : info.imageLinks.thumbnail}
                                    alt={info.title}
                                    className={`object-cover rounded-lg shadow-sm transition-all duration-300 ${
                                        isSelected ? 'w-32 h-48' : 'w-16 h-24'
                                    }`}
                                    />
                                ) : (
                                    <div className={`bg-neutral-200 rounded-lg flex items-center justify-center text-neutral-400 ${isSelected ? 'w-32 h-48' : 'w-16 h-24'}`}>
                                        <BookOpen className="w-8 h-8" />
                                    </div>
                                )}
                            </div>

                            {/* Info Principal */}
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                                <div>
                                    <h3 className={`font-heading leading-tight mb-1 ${isSelected ? 'text-xl text-primary-900' : 'text-base text-neutral-800'}`}>
                                        {info.title}
                                    </h3>
                                    <p className="text-sm text-neutral-600 font-ui mb-2">
                                        {info.authors?.join(', ') || 'Autor desconocido'}
                                    </p>
                                    
                                    {/* Badges de info */}
                                    <div className="flex flex-wrap gap-2 mb-2">
                                        {info.publishedDate && (
                                            <span className="text-xs bg-white border border-neutral-200 px-2 py-1 rounded text-neutral-500">
                                                {info.publishedDate.split('-')[0]}
                                            </span>
                                        )}
                                        {info.pageCount && (
                                            <span className="text-xs bg-white border border-neutral-200 px-2 py-1 rounded text-neutral-500">
                                                {info.pageCount} págs
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Indicador de expansión */}
                                <div className="text-xs font-medium text-primary-600 flex items-center mt-2">
                                    {isSelected ? (
                                        <span className="flex items-center"><ChevronUp className="w-4 h-4 mr-1"/> Ocultar detalles</span>
                                    ) : (
                                        <span className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"><Info className="w-4 h-4 mr-1"/> Ver detalles</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* ✅ NUEVO: SECCIÓN DE SINOPSIS EXPANDIBLE */}
                        {isSelected && (
                            <div className="px-4 pb-4 pt-0 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="bg-white p-4 rounded-lg border border-primary-100 text-sm text-neutral-700 font-ui leading-relaxed max-h-60 overflow-y-auto custom-scrollbar">
                                    <h4 className="font-bold text-primary-800 mb-2 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4"/> Sinopsis
                                    </h4>
                                    {info.description ? (
                                        <p>{info.description}</p>
                                    ) : (
                                        <p className="italic text-neutral-400">No hay descripción disponible para este libro.</p>
                                    )}
                                </div>
                            </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
           

          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div className="space-y-6">
              {/* Título */}
              <div>
                <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
                  Título 
                </label>
                <input
                  type="text"
                  value={uploadData.titulo}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, titulo: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                  placeholder="Título del libro"
                  required
                />
              </div>

              {/* Autor */}
              <div>
                <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
                  Autor 
                </label>
                <input
                  type="text"
                  value={uploadData.autor}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, autor: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                  placeholder="Nombre del autor"
                  required
                />
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={uploadData.descripcion}
                  onChange={(e) =>
                    setUploadData({ ...uploadData, descripcion: e.target.value })
                  }
                  className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                  rows="3"
                  placeholder="Breve descripción del libro"
                />
              </div>

              {/* Páginas */}
<div>
  <label className="block text-sm font-ui font-medium text-neutral-700 mb-1">
    Número de páginas {uploadData.pdf ? '(Opcional)' : ''}
  </label>
  <input
    type="number"
    value={uploadData.pageCount}
    onChange={(e) =>
      setUploadData({ ...uploadData, pageCount: e.target.value })
    }
    className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
    placeholder={uploadData.pdf ? "Dejar vacío para autodetectar" : "Ej: 300"}
    disabled={loading} 
  />
  
  {uploadData.pdf && (
    <p className="text-xs text-green-600 mt-1 font-medium">
      ✨ Si lo dejas vacío, contaremos las páginas del PDF automáticamente.
    </p>
  )}
</div>

              {/* Portada */}
              <div>
                <label className="block text-sm font-ui font-medium text-neutral-700 mb-2">
                  Portada (opcional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 5 * 1024 * 1024) {
                        toast.error('La imagen no debe superar los 5MB');
                        return;
                      }
                      setUploadData({ ...uploadData, cover: file });
                    }
                  }}
                  className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                />
                {uploadData.cover && (
                  <p className="mt-1 text-sm text-green-600 font-ui">
                    ✓ {uploadData.cover.name}
                  </p>
                )}
              </div>

              {/* PDF */}
              <div>
                <label className="block text-sm font-ui font-medium text-neutral-700 mb-2">
                  Archivo PDF
                </label>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 50 * 1024 * 1024) {
                        toast.error('El archivo no debe superar los 50MB');
                        return;
                      }
                      setUploadData({ ...uploadData, pdf: file });
                    }
                  }}
                  className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                />
                {uploadData.pdf && (
                  <p className="mt-1 text-sm text-green-600 font-ui">
                    ✓ {uploadData.pdf.name}
                  </p>
                )}
              </div>

              {/* EPUB */}
              <div>
                <label className="block text-sm font-ui font-medium text-neutral-700 mb-2">
                  Archivo EPUB (alternativa)
                </label>
                <input
                  type="file"
                  accept=".epub,application/epub+zip"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      if (file.size > 50 * 1024 * 1024) {
                        toast.error('El archivo no debe superar los 50MB');
                        return;
                      }
                      setUploadData({ ...uploadData, epub: file });
                    }
                  }}
                  className="w-full px-4 py-2 border-2 border-neutral-300 rounded-lg font-ui focus:border-primary-500 focus:outline-none"
                />
                {uploadData.epub && (
                  <p className="mt-1 text-sm text-green-600 font-ui">
                    ✓ {uploadData.epub.name}
                  </p>
                )}
              </div>

              {/* Nota */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 font-ui">
                  📚 Debes subir al menos un archivo PDF o EPUB
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-neutral-200 bg-neutral-50">
          {/* Shelf Selector */}
          <div>
            <label className="block text-sm font-ui font-medium text-neutral-700 mb-2">
              Agregar a:
            </label>
            <div className="flex flex-wrap gap-2">
              {SHELVES.map((shelf) => (
                <button
                  key={shelf.value}
                  onClick={() => setSelectedShelf(shelf.value)}
                  className={`px-3 py-1 rounded-full text-sm font-ui transition-all ${
                    selectedShelf === shelf.value
                      ? shelf.color
                      : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                  }`}
                >
                  {shelf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handleClose} className="btn-outline">
              Cancelar
            </button>
            <button
              onClick={handleAddBook}
              disabled={
                loading ||
                (activeTab === 'manual' && (!manualData.titulo || !manualData.autor)) ||
                (activeTab === 'google' && !selectedGoogleBook) ||
                (activeTab === 'upload' &&
                  ((!uploadData.pdf && !uploadData.epub))) //!uploadData.titulo || !uploadData.autor ||
              }
              className="btn-primary"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Agregando...
                </>
              ) : (
                'Agregar'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}