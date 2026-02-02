// src/components/books/AddBookModal.jsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Search, Upload, BookOpen, Loader2, Plus, Info, ChevronUp } from 'lucide-react';
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

const getHighResCover = (url) => {
  if (!url) return null;
  let cleanUrl = url.replace('http:', 'https:').replace('&edge=curl', '');
  cleanUrl = cleanUrl.replace(/&zoom=\d/, '');
  return `${cleanUrl}&w=1000`;
};

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  try {
    const storage = localStorage.getItem('auth-storage');
    if (!storage) return null;
    return JSON.parse(storage).state?.accessToken || null;
  } catch (error) { return null; }
};

export default function AddBookModal({ isOpen, onClose, onBookAdded }) {
  const [activeTab, setActiveTab] = useState('manual');
  const [selectedShelf, setSelectedShelf] = useState('QUIERO_LEER');
  const [loading, setLoading] = useState(false);

  // Manual State
  const [manualData, setManualData] = useState({
    titulo: '', autor: '', subtitulo: '', descripcion: '',
    pageCount: '', categorias: '', isbn13: '', isbn10: '',
    coverImageUrl: '', publicacion: '', fechaPublicacion: '', idioma: 'es',
  });

  // Google Books State
  const [googleQuery, setGoogleQuery] = useState('');
  const [googleResults, setGoogleResults] = useState([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [selectedGoogleBook, setSelectedGoogleBook] = useState(null);
  
  // Refs para control de debounce y cancelación
  const abortControllerRef = useRef(null);
  const debounceTimeoutRef = useRef(null);

  // Upload State
  const [uploadData, setUploadData] = useState({
    titulo: '', autor: '', descripcion: '', pageCount: '',
    cover: null, pdf: null, epub: null,
  });

  useEffect(() => {
    if (isOpen) {
      setActiveTab('manual');
      setSelectedShelf('QUIERO_LEER');
      // Resetear estados...
      setManualData({ titulo: '', autor: '', subtitulo: '', descripcion: '', pageCount: '', categorias: '', isbn13: '', isbn10: '', coverImageUrl: '', publicacion: '', fechaPublicacion: '', idioma: 'es' });
      setGoogleQuery('');
      setGoogleResults([]);
      setSelectedGoogleBook(null);
      setUploadData({ titulo: '', autor: '', descripcion: '', pageCount: '', cover: null, pdf: null, epub: null });
    }
  }, [isOpen]);

  const handleClose = () => onClose();

  // --- LÓGICA DE BÚSQUEDA SEGURA ---

  const performSearch = async (query) => {
    if (!query || query.length < 3) return;

    // 1. Cancelar petición anterior si existe (Para no saturar a Google)
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    
    // Crear nuevo controlador
    abortControllerRef.current = new AbortController();

    try {
      setGoogleLoading(true);
      
      const response = await axios.get(
        `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=20&langRestrict=es`,
        { signal: abortControllerRef.current.signal } // Conectar señal de cancelación
      );

      setGoogleResults(response.data.items || []);
    } catch (error) {
      if (axios.isCancel(error)) {
          console.log('Petición cancelada por nueva búsqueda');
          return; // No hacemos nada, es normal
      }
      console.error('Error Google Books:', error);
      if (error.response?.status === 429) {
         toast.error("Demasiadas búsquedas. Espera 1 minuto.");
      }
    } finally {
      // Solo quitamos loading si NO fue cancelada
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
          setGoogleLoading(false);
      }
    }
  };

  // Efecto para detectar escritura (Debounce)
  useEffect(() => {
    // Limpiar timeout anterior
    if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);

    // Configurar nuevo timeout (1 segundo de espera)
    debounceTimeoutRef.current = setTimeout(() => {
        if (googleQuery.trim().length > 2) {
            performSearch(googleQuery);
        }
    }, 1000);

    return () => {
        if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
    };
  }, [googleQuery]);

  const handleManualSearchSubmit = (e) => {
      e.preventDefault();
      // Si el usuario da Enter, cancelamos el debounce y buscamos YA
      if (debounceTimeoutRef.current) clearTimeout(debounceTimeoutRef.current);
      performSearch(googleQuery);
  };

  // --- AGREGAR LIBRO ---
  const handleAddBook = async () => {
    try {
      setLoading(true);

      if (activeTab === 'manual') {
        if (!manualData.titulo?.trim() || !manualData.autor?.trim()) {
          toast.error('Título y Autor son requeridos');
          return;
        }
        await api.post('/api/library/books', {
          ...manualData,
          pageCount: manualData.pageCount ? parseInt(manualData.pageCount) : null,
          source: 'MANUAL',
          shelf: selectedShelf,
        });
        toast.success('¡Libro agregado!');

      } else if (activeTab === 'google') {
        if (!selectedGoogleBook) {
          toast.error('Selecciona un libro');
          return;
        }
        const info = selectedGoogleBook.volumeInfo;
        const payload = {
          titulo: info.title,
          subtitulo: info.subtitle || null,
          autor: info.authors?.join(', ') || 'Autor desconocido',
          descripcion: info.description || null,
          pageCount: info.pageCount || null,
          categorias: info.categories?.join(', ') || null,
          idioma: info.language || 'es',
          isbn10: info.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier || null,
          isbn13: info.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || null,
          coverImageUrl: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
          publicacion: info.publisher || null,
          fechaPublicacion: info.publishedDate || null,
          source: 'GOOGLE_BOOKS',
          googleBookId: selectedGoogleBook.id,
          shelf: selectedShelf,
        };
        await api.post('/api/library/books', payload);
        toast.success('¡Libro agregado!');

      } else if (activeTab === 'upload') {
        if (!uploadData.pdf && !uploadData.epub) {
          toast.error('Sube un PDF o EPUB');
          return;
        }
        const formData = new FormData();
        // Lógica de llenado de FormData simplificada...
        if(uploadData.titulo) formData.append('titulo', uploadData.titulo);
        if(uploadData.autor) formData.append('autor', uploadData.autor);
        if(uploadData.pdf) formData.append('source', 'PDF'); else formData.append('source', 'EPUB');
        formData.append('shelf', selectedShelf);
        if(uploadData.descripcion) formData.append('descripcion', uploadData.descripcion);
        if(uploadData.pageCount) formData.append('pageCount', uploadData.pageCount);
        if(uploadData.cover) formData.append('cover', uploadData.cover);
        if(uploadData.pdf) formData.append('pdf', uploadData.pdf);
        if(uploadData.epub) formData.append('epub', uploadData.epub);

        await uploadBook(formData);
        toast.success('¡Libro subido!');
      }

      if (onBookAdded) await onBookAdded();
      handleClose();

    } catch (error) {
      console.error(error);
      toast.error('Error al guardar el libro');
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
          <button onClick={handleClose} className="p-2 hover:bg-neutral-100 rounded-lg"><X className="w-6 h-6"/></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 px-6">
          <button onClick={() => setActiveTab('manual')} className={`px-6 py-3 border-b-2 font-medium ${activeTab === 'manual' ? 'border-primary-600 text-primary-600' : 'border-transparent text-neutral-600'}`}><Plus className="w-4 h-4 inline mr-2"/> Manual</button>
          <button onClick={() => setActiveTab('google')} className={`px-6 py-3 border-b-2 font-medium ${activeTab === 'google' ? 'border-primary-600 text-primary-600' : 'border-transparent text-neutral-600'}`}><Search className="w-4 h-4 inline mr-2"/> Google Books</button>
          <button onClick={() => setActiveTab('upload')} className={`px-6 py-3 border-b-2 font-medium ${activeTab === 'upload' ? 'border-primary-600 text-primary-600' : 'border-transparent text-neutral-600'}`}><Upload className="w-4 h-4 inline mr-2"/> Subir</button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'manual' && (
             <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <input className="input-field border p-2 rounded w-full" placeholder="Título *" value={manualData.titulo} onChange={e => setManualData({...manualData, titulo: e.target.value})} />
                    <input className="input-field border p-2 rounded w-full" placeholder="Autor *" value={manualData.autor} onChange={e => setManualData({...manualData, autor: e.target.value})} />
                    <input className="input-field border p-2 rounded w-full" type="number" placeholder="Páginas" value={manualData.pageCount} onChange={e => setManualData({...manualData, pageCount: e.target.value})} />
                    <input className="input-field border p-2 rounded w-full" placeholder="Categoría" value={manualData.categorias} onChange={e => setManualData({...manualData, categorias: e.target.value})} />
                </div>
                <textarea className="input-field border p-2 rounded w-full" rows="3" placeholder="Descripción" value={manualData.descripcion} onChange={e => setManualData({...manualData, descripcion: e.target.value})} />
                <input className="input-field border p-2 rounded w-full" placeholder="URL Portada" value={manualData.coverImageUrl} onChange={e => setManualData({...manualData, coverImageUrl: e.target.value})} />
             </div>
          )}

          {activeTab === 'google' && (
            <div className="space-y-6">
              <form onSubmit={handleManualSearchSubmit} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 w-5 h-5 text-neutral-400" />
                  <input
                    type="text"
                    value={googleQuery}
                    onChange={(e) => setGoogleQuery(e.target.value)}
                    placeholder="Buscar por título, autor o ISBN..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-neutral-200 rounded-xl outline-none focus:border-primary-500"
                  />
                </div>
                <button type="submit" disabled={googleLoading} className="btn-primary px-6 rounded-xl bg-primary-600 text-white font-bold">
                  {googleLoading ? <Loader2 className="animate-spin" /> : 'Buscar'}
                </button>
              </form>

              <div className="grid gap-4">
                  {googleResults.map((book) => (
                      <div key={book.id} onClick={() => setSelectedGoogleBook(selectedGoogleBook?.id === book.id ? null : book)} className={`flex gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all ${selectedGoogleBook?.id === book.id ? 'border-primary-500 bg-primary-50' : 'border-neutral-100 hover:border-primary-300'}`}>
                          <img src={book.volumeInfo.imageLinks?.thumbnail || ''} className="w-16 h-24 object-cover rounded bg-gray-200" alt="" />
                          <div>
                              <h3 className="font-bold text-gray-800">{book.volumeInfo.title}</h3>
                              <p className="text-sm text-gray-600">{book.volumeInfo.authors?.join(', ')}</p>
                          </div>
                      </div>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
             <div className="space-y-4 text-center">
                <input type="file" accept=".pdf,.epub" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100" onChange={e => setUploadData({...uploadData, pdf: e.target.files[0]})} />
                <p className="text-xs text-gray-500">Sube tu PDF o EPUB</p>
             </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50 flex justify-between items-center">
            <select value={selectedShelf} onChange={e => setSelectedShelf(e.target.value)} className="border rounded p-2 text-sm">
                {SHELVES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <div className="flex gap-3">
                <button onClick={handleClose} className="px-4 py-2 border rounded hover:bg-gray-100">Cancelar</button>
                <button onClick={handleAddBook} disabled={loading} className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50">
                    {loading ? 'Guardando...' : 'Agregar'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}