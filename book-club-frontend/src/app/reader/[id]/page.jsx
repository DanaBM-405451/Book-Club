'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, Menu, X, Trash2, Loader2, ChevronLeft, ChevronRight, Palette, 
  ZoomIn, ZoomOut, StickyNote, Type, BookmarkPlus
} from 'lucide-react';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import AdobePdfViewer from '@/components/books/AdobePdfViewer';

// ✅ 1. RESTAURAMOS LA CONSTANTE 'THEMES' (Esto arregla el crash)
const THEMES = {
  light: {
    name: 'Claro',
    style: { body: { color: '#000000', background: '#ffffff' } },
    bgClass: 'bg-white text-neutral-900'
  },
  sepia: {
    name: 'Crema',
    style: { body: { color: '#5b4636', background: '#f4ecd8' } },
    bgClass: 'bg-[#f4ecd8] text-[#5b4636]'
  },
  dark: {
    name: 'Oscuro',
    style: { body: { color: '#c9c9c9', background: '#1a1a1a' } },
    bgClass: 'bg-[#1a1a1a] text-[#c9c9c9]'
  }
};

export default function ReaderPage() {
  const router = useRouter();
  const params = useParams();
  
  // --- ESTADOS DE DATOS ---
  const [book, setBook] = useState(null);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- UI LECTOR ---
  const [showSidebar, setShowSidebar] = useState(false);
  const [locationStr, setLocationStr] = useState('');
  
  // Menú Flotante de Selección
  const [selectionMenu, setSelectionMenu] = useState({ show: false, x: 0, y: 0, cfiRange: null, text: '' });
  
  // Modal de Nota
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [currentCfiForNote, setCurrentCfiForNote] = useState(null);

  // Configuración de Lectura
  const [currentTheme, setCurrentTheme] = useState('light');
  const [fontSize, setFontSize] = useState(100);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Refs para EPUB
  const epubContainerRef = useRef(null); 
  const renditionRef = useRef(null);
  const bookRef = useRef(null);
  const isRendered = useRef(false);

  // ✅ 2. REFS PARA EL TIEMPO Y PROGRESO (Nuevo)
  const startTimeRef = useRef(Date.now());
  const lastPageRef = useRef(null);

  // 1. CARGA INICIAL
  useEffect(() => { loadBookData(); }, []);

  // Guardar progreso al salir (Desmontar componente)
  useEffect(() => {
    return () => {
      if (lastPageRef.current) {
        saveProgress(lastPageRef.current, true); // Forzar guardado al salir
      }
      // Limpieza EPUB
      if (bookRef.current) {
        bookRef.current.destroy();
        isRendered.current = false;
      }
    };
  }, []);

  // 2. INICIAR EPUB (Solo si es epub)
  useEffect(() => {
    if (book?.epubFileUrl && epubContainerRef.current && !isRendered.current) {
      setTimeout(() => initEpub(), 200);
    }
  }, [book?.epubFileUrl]);

  const loadBookData = async () => {
    try {
      setLoading(true);
      const [bookRes, notesRes] = await Promise.all([
        api.get(`/api/library/books/${params.id}`),
        api.get(`/api/library/books/${params.id}/notes`)
      ]);
      
      const bookData = bookRes.data.data.userBook.book;
      // Inyectamos userBook dentro de book para tener el progreso
      bookData.userBook = bookRes.data.data.userBook;
      
      setBook(bookData);
      setNotes(notesRes.data.data.notes || []);

      // Inicializar refs
      startTimeRef.current = Date.now();
      lastPageRef.current = bookData.userBook?.currentPage || (bookData.epubFileUrl ? null : 1);

    } catch (error) {
      console.error(error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // ✅ 3. FUNCIÓN INTELIGENTE DE GUARDADO (Unifica PDF y EPUB + Tiempo)
  /*const saveProgress = async (pageOrCfi, forceSave = false) => {
    // Actualizar ref local siempre
    lastPageRef.current = pageOrCfi;

    const now = Date.now();
    const timeDiff = now - startTimeRef.current;
    const minutes = Math.floor(timeDiff / 1000 / 60);

    // Guardar si pasó 1 minuto O si forzamos el guardado (al salir) O si es un cambio significativo
    if (minutes >= 1 || forceSave) {
        try {
            console.log(`💾 Guardando: Ubicación ${pageOrCfi} - Tiempo: ${minutes} min`);
            
            // Detectar si es EPUB por el formato del CFI
            const isEpub = typeof pageOrCfi === 'string' && pageOrCfi.startsWith('epubcfi');

            await api.put(`/api/library/books/${params.id}/progress`, { 
                currentPage: pageOrCfi, 
                durationMinutes: minutes, // ✅ Enviamos tiempo al backend
                isEpub: isEpub
            });

            // Reiniciar contador de tiempo para no sumar doble
            startTimeRef.current = Date.now();
        } catch (e) {
            console.error("Error guardando progreso", e);
        }
    }
  };*/

  const saveProgress = async (pageOrCfi, forceSave = false) => {
    lastPageRef.current = pageOrCfi;

    const now = Date.now();
    const timeDiff = now - startTimeRef.current;
    const minutes = Math.floor(timeDiff / 1000 / 60);

    // Guardar si pasó 1 minuto O si forzamos el guardado
    if (minutes >= 1 || forceSave) {
        try {
            console.log(`💾 Guardando: ${pageOrCfi} (${minutes} min)`);
            
            const isEpub = typeof pageOrCfi === 'string' && pageOrCfi.startsWith('epubcfi');
            
            // Construimos el payload
            const payload = { 
                currentPage: pageOrCfi,
                isEpub
            };

            // Solo agregamos minutos si son mayores a 0
            if (minutes > 0) {
                payload.durationMinutes = minutes;
            }

            await api.put(`/api/library/books/${params.id}/progress`, payload);

            // Reiniciar contador SOLO si enviamos tiempo
            if (minutes > 0) startTimeRef.current = Date.now();

        } catch (e) {
            console.error("Error guardando progreso", e);
        }
    }
  };

 const initEpub = async () => {
   if (!epubContainerRef.current) return;

    try {
      const ePub = (await import('epubjs')).default;
      const response = await fetch(book.epubFileUrl);
      const arrayBuffer = await response.arrayBuffer();
      
      const epubBook = ePub(arrayBuffer);
      bookRef.current = epubBook;
      await epubBook.ready;

      // 🛡️ DOBLE PROTECCIÓN: Verificamos de nuevo antes de usarlo
      if (!epubContainerRef.current) return;

      const { clientWidth, clientHeight } = epubContainerRef.current;

      // 1. PRIMERO DEFINIMOS RENDITION
      const rendition = epubBook.renderTo(epubContainerRef.current, {
        width: clientWidth,
        height: clientHeight,
        flow: 'paginated',
        manager: 'default',
        allowScriptedContent: true,
      });

      // 2. GUARDAMOS LA REFERENCIA
      renditionRef.current = rendition;
      isRendered.current = true;

      // 3. REGISTRAMOS TEMAS
      rendition.themes.register('light', THEMES.light.style);
      rendition.themes.register('sepia', THEMES.sepia.style);
      rendition.themes.register('dark', THEMES.dark.style);
      rendition.themes.select(currentTheme); // Usar el tema actual del estado
      rendition.themes.fontSize(`${fontSize}%`);

      // 4. MOSTRAR PÁGINA (Recuperar progreso)
      // Buscamos en lastReadPosition (EPUB) o currentPage (fallback)
      const savedCfi = book.userBook?.lastReadPosition || book.userBook?.currentPage;
      
      if (savedCfi && typeof savedCfi === 'string' && savedCfi.startsWith('epubcfi')) {
        await rendition.display(savedCfi);
      } else {
        await rendition.display();
      }

      // 5. REGISTRAR EVENTOS (Ahora sí, porque rendition ya existe)
      rendition.on('relocated', (location) => {
        setSelectionMenu(prev => ({ ...prev, show: false }));
        if (location.start) {
          const percent = Math.floor(location.start.percentage * 100);
          setLocationStr(`${percent}%`);
          // Guardar progreso
          saveProgress(location.start.cfi);
        }
      });

      rendition.on('selected', (cfiRange, contents) => {
        const selection = contents.window.getSelection();
        if (selection.toString().length > 0) {
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          // Aseguramos que el iframe existe antes de leer su rect
          const iframe = epubContainerRef.current.querySelector('iframe');
          if (iframe) {
              const iframeRect = iframe.getBoundingClientRect();
              setSelectionMenu({
                show: true,
                x: rect.left + iframeRect.left + (rect.width / 2),
                y: rect.top + iframeRect.top - 10,
                cfiRange: cfiRange,
                text: selection.toString()
              });
          }
        }
      });

      rendition.on('click', () => {
        setSelectionMenu(prev => ({ ...prev, show: false }));
        setShowSettingsMenu(false);
      });

      // 6. INYECTAR ESTILOS CSS
      rendition.hooks.content.register((contents) => {
        const style = contents.document.createElement('style');
        style.innerHTML = `
          ::selection { background: rgba(255, 215, 0, 0.3); }
          .hl-yellow { background-color: rgba(255, 235, 59, 0.5); mix-blend-mode: multiply; }
          .hl-green { background-color: rgba(76, 175, 80, 0.5); mix-blend-mode: multiply; }
          .hl-pink { background-color: rgba(240, 98, 146, 0.5); mix-blend-mode: multiply; }
          body[style*="background: rgb(26, 26, 26)"] .hl-yellow { mix-blend-mode: normal; opacity: 0.4; }
          body { font-family: 'Helvetica', sans-serif !important; line-height: 1.6 !important; } 
        `;
        contents.document.head.appendChild(style);
        
        contents.document.addEventListener('keydown', (e) => {
          if (e.key === 'ArrowLeft') rendition.prev();
          if (e.key === 'ArrowRight') rendition.next();
        });
      });

      // 7. PINTAR NOTAS
      if (notes && notes.length > 0) {
        notes.forEach(note => {
            if (note.cfiRange) {
                try {
                    rendition.annotations.add('highlight', note.cfiRange, {}, null, `hl-${note.color || 'yellow'}`);
                } catch(e) { console.warn("Error pintando nota:", e); }
            }
        });
      }

    } catch (error) {
      console.error("Error EPUB:", error);
      toast.error("Error al cargar libro EPUB");
    }
  };

  // --- FUNCIONES UI ---
  const handlePrev = () => renditionRef.current?.prev();
  const handleNext = () => renditionRef.current?.next();

  const handleZoom = (direction) => {
    let newSize = fontSize;
    if (direction === 'in') newSize = Math.min(200, fontSize + 10);
    if (direction === 'out') newSize = Math.max(50, fontSize - 10);
    setFontSize(newSize);
    renditionRef.current?.themes.fontSize(`${newSize}%`);
  };

  const changeTheme = (themeKey) => {
    setCurrentTheme(themeKey);
    renditionRef.current?.themes.select(themeKey);
  };

  // --- ANOTACIONES ---
  const addHighlight = async (color) => {
    if (!selectionMenu.cfiRange) return;
    
    renditionRef.current.annotations.add('highlight', selectionMenu.cfiRange, {}, null, `hl-${color}`);
    renditionRef.current.getContents()[0].window.getSelection().removeAllRanges();
    setSelectionMenu(prev => ({ ...prev, show: false }));

    try {
      const res = await api.post(`/api/library/books/${params.id}/notes`, {
        content: selectionMenu.text, type: 'HIGHLIGHT', cfiRange: selectionMenu.cfiRange, color, page: 0
      });
      setNotes([...notes, res.data.data.note]);
      toast.success('Subrayado guardado');
    } catch (e) { toast.error('Error al guardar'); }
  };

  const openNoteFromSelection = () => {
    if (!selectionMenu.cfiRange) return;
    setCurrentCfiForNote(selectionMenu.cfiRange);
    setNoteContent('');
    setShowNoteModal(true);
    setSelectionMenu(prev => ({ ...prev, show: false }));
  };

  const openNoteFromHeader = () => {
    const currentLocation = renditionRef.current?.location?.start?.cfi;
    setCurrentCfiForNote(currentLocation || null);
    setNoteContent('');
    setShowNoteModal(true);
  };

  const saveNote = async () => {
    if (!noteContent.trim()) return;
    const isRange = currentCfiForNote && currentCfiForNote.includes(','); 

    if (isRange) {
      renditionRef.current.annotations.add('highlight', currentCfiForNote, {}, null, 'hl-yellow');
      const selection = renditionRef.current.getContents()[0]?.window.getSelection();
      if(selection) selection.removeAllRanges();
    }

    try {
      const res = await api.post(`/api/library/books/${params.id}/notes`, {
        content: noteContent, type: 'NOTE', cfiRange: currentCfiForNote, color: 'yellow', page: 0
      });
      setNotes([...notes, res.data.data.note]);
      toast.success('Nota guardada');
      setShowNoteModal(false);
    } catch (e) { toast.error('Error al guardar nota'); }
  };

  const deleteAnnotation = async (id, cfiRange) => {
    try {
      await api.delete(`/api/library/notes/${id}`);
      setNotes(notes.filter(n => n.id !== id));
      if (cfiRange) renditionRef.current?.annotations.remove(cfiRange, 'highlight');
      toast.success('Eliminado');
    } catch (e) {}
  };

  // ✅ Wrapper para el PDF (recibe el número de página del componente hijo)
  const handlePdfProgress = (pageNumber) => {
    saveProgress(parseInt(pageNumber));
  };

  if (loading) return <div className="h-screen bg-neutral-50 flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!book) return null;

  return (
    <>
      <Toaster position="top-center" />
      
      {/* Si es PDF */}
      {book.pdfFileUrl ? (
         <div className="h-screen w-screen flex flex-col bg-neutral-100">
            {/* Header simple para PDF */}
            <div className="h-14 bg-white border-b flex items-center px-4 justify-between shrink-0 shadow-sm z-10">
               <button onClick={() => router.back()} className="flex items-center gap-2 text-sm font-bold text-neutral-600 hover:text-neutral-900">
                 <ArrowLeft className="w-5 h-5" /> Volver
               </button>
               <span className="font-medium truncate max-w-md">{book.titulo}</span>
               <div className="w-5"></div>
            </div>
            
            {/* Visor PDF */}
            <div className="flex-1 overflow-hidden relative">
                <AdobePdfViewer 
                    url={book.pdfFileUrl} 
                    title={book.titulo}
                    initialPage={book.userBook?.currentPage || 1}
                    onProgress={handlePdfProgress} // ✅ CONECTADO
                />
            </div>
         </div>
      ) : (
         /* Si es EPUB */
         <div className={`h-screen w-screen flex flex-col overflow-hidden transition-colors duration-300 ${THEMES[currentTheme].bgClass}`}>
            
            {/* HEADER EPUB */}
            <header className={`h-14 flex items-center justify-between px-4 z-20 shadow-sm flex-shrink-0 border-b ${currentTheme === 'dark' ? 'border-neutral-700 bg-neutral-800' : 'border-neutral-200 bg-white'}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => router.back()} className="p-2 hover:opacity-70 rounded-full transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <h1 className="text-sm font-bold line-clamp-1 max-w-[200px]">{book.titulo}</h1>
                  <p className="text-xs opacity-70">{locationStr || '...'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={openNoteFromHeader} className="p-2 hover:opacity-70 rounded-full" title="Nota">
                  <StickyNote className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button onClick={() => setShowSettingsMenu(!showSettingsMenu)} className={`p-2 hover:opacity-70 rounded-full ${showSettingsMenu ? 'bg-black/10' : ''}`}>
                    <Type className="w-5 h-5" />
                  </button>
                  {showSettingsMenu && (
                    <div className="absolute right-0 top-full mt-2 bg-white text-black p-4 rounded-xl shadow-xl border border-neutral-200 min-w-[220px] z-50 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between mb-4 border-b pb-3 border-neutral-100">
                        <button onClick={() => handleZoom('out')} className="p-2 hover:bg-neutral-100 rounded-lg"><ZoomOut className="w-4 h-4" /></button>
                        <span className="font-bold text-sm">{fontSize}%</span>
                        <button onClick={() => handleZoom('in')} className="p-2 hover:bg-neutral-100 rounded-lg"><ZoomIn className="w-4 h-4" /></button>
                      </div>
                      <p className="text-xs text-neutral-400 font-bold mb-2 uppercase">Tema</p>
                      <div className="flex gap-3 justify-center">
                        {Object.keys(THEMES).map(key => (
                          <button key={key} onClick={() => changeTheme(key)} className={`w-10 h-10 rounded-full border-2 transition-transform hover:scale-105 ${currentTheme === key ? 'border-primary-500 ring-2 ring-primary-100' : 'border-neutral-200'}`} style={{ background: THEMES[key].style.body.background }} title={THEMES[key].name} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={() => setShowSidebar(true)} className="p-2 hover:opacity-70 rounded-full relative">
                  <Menu className="w-5 h-5" />
                  {notes.length > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-primary-500 rounded-full"></span>}
                </button>
              </div>
            </header>

            {/* READER AREA EPUB */}
            <div className="flex-1 relative w-full h-full overflow-hidden flex justify-center">
                <button onClick={handlePrev} className="absolute left-0 top-0 bottom-0 w-16 flex items-center justify-start pl-4 z-10 hover:bg-black/5 outline-none group">
                  <ChevronLeft className="w-8 h-8 opacity-20 group-hover:opacity-50 transition-opacity" />
                </button>
                <div ref={epubContainerRef} className="w-full h-full max-w-4xl shadow-sm" />
                <button onClick={handleNext} className="absolute right-0 top-0 bottom-0 w-16 flex items-center justify-end pr-4 z-10 hover:bg-black/5 outline-none group">
                  <ChevronRight className="w-8 h-8 opacity-20 group-hover:opacity-50 transition-opacity" />
                </button>
                {selectionMenu.show && (
                  <div className="fixed z-50 bg-neutral-900 text-white rounded-full px-4 py-2 flex items-center gap-3 shadow-2xl animate-in zoom-in-90" style={{ top: selectionMenu.y, left: selectionMenu.x, transform: 'translate(-50%, -100%)' }}>
                    <button onClick={() => addHighlight('yellow')} className="w-5 h-5 rounded-full bg-yellow-400 hover:scale-125 border border-white/20" />
                    <button onClick={() => addHighlight('green')} className="w-5 h-5 rounded-full bg-green-500 hover:scale-125 border border-white/20" />
                    <button onClick={() => addHighlight('pink')} className="w-5 h-5 rounded-full bg-pink-500 hover:scale-125 border border-white/20" />
                    <div className="w-px h-4 bg-white/20" />
                    <button onClick={openNoteFromSelection} className="hover:text-primary-300 transition-colors flex items-center gap-1 text-sm font-medium"><StickyNote className="w-4 h-4" /> Nota</button>
                    <div className="w-px h-4 bg-white/20" />
                    <button onClick={() => setSelectionMenu(prev => ({...prev, show: false}))}><X className="w-4 h-4 text-neutral-400 hover:text-white" /></button>
                  </div>
                )}
            </div>

            {/* SIDEBAR */}
            {showSidebar && (
                <div className="absolute inset-y-0 right-0 w-80 bg-white text-black border-l shadow-2xl z-40 flex flex-col animate-in slide-in-from-right">
                  <div className="p-4 border-b flex justify-between items-center bg-neutral-50">
                    <h2 className="font-bold">Anotaciones</h2>
                    <button onClick={() => setShowSidebar(false)}><X className="w-5 h-5" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {notes.length === 0 && <p className="text-center text-neutral-400 text-sm mt-10">No hay notas ni subrayados.</p>}
                    {notes.map(note => (
                      <div key={note.id} onClick={() => { if(note.cfiRange) renditionRef.current?.display(note.cfiRange); setShowSidebar(false); }} className="p-3 bg-neutral-50 rounded border-l-4 cursor-pointer hover:bg-neutral-100 relative group" style={{ borderColor: note.color === 'green' ? '#4ade80' : note.color === 'pink' ? '#f472b6' : '#facc15' }}>
                        <div className="flex justify-between items-start mb-1">
                          <span className="text-xs font-bold text-neutral-500 uppercase">{note.type === 'NOTE' ? 'Nota' : 'Subrayado'}</span>
                          {note.type === 'NOTE' && <StickyNote className="w-3 h-3 text-neutral-400" />}
                        </div>
                        <p className="text-sm line-clamp-3 text-neutral-800 italic">"{note.content}"</p>
                        <div className="flex justify-between mt-2 border-t border-neutral-200 pt-2">
                          <span className="text-xs text-neutral-400">{new Date(note.createdAt).toLocaleDateString()}</span>
                          <button onClick={(e) => { e.stopPropagation(); deleteAnnotation(note.id, note.cfiRange); }}><Trash2 className="w-3 h-3 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
            )}
            
            {/* Modal Nota */}
            {showNoteModal && (
              <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95">
                  <h3 className="font-heading text-lg mb-4 text-neutral-900 flex items-center gap-2"><StickyNote className="w-5 h-5 text-primary-500" /> Agregar Nota</h3>
                  <textarea className="w-full h-32 p-3 border border-neutral-200 rounded-lg font-ui text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none" placeholder="Escribe tu pensamiento sobre esto..." value={noteContent} onChange={(e) => setNoteContent(e.target.value)} autoFocus />
                  <div className="flex gap-3 mt-4">
                    <button onClick={() => setShowNoteModal(false)} className="flex-1 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors font-medium">Cancelar</button>
                    <button onClick={saveNote} disabled={!noteContent.trim()} className="flex-1 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium disabled:opacity-50">Guardar</button>
                  </div>
                </div>
              </div>
            )}
         </div>
      )}
    </>
  );
}
/*
'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  BookmarkPlus,
  StickyNote,
  Menu,
  X,
  Edit,
  Trash2,
  Loader2,
  Book,
} from 'lucide-react';
//import dynamic from 'next/dynamic';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';
import AdobePdfViewer from '@/components/books/AdobePdfViewer';


export default function ReaderPage() {
  const router = useRouter();
  const params = useParams();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  
 /* // PDF state
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  //  1. NUEVO: Referencia para guardar la página actual "en vivo"
  // Esto evita que al cerrar la página se guarde el valor inicial "1"
  const currentPageRef = useRef(1);
  const [scale, setScale] = useState(1.2);*/
/*
// PDF state
  const [pageNumber, setPageNumber] = useState(1);
  const currentPageRef = useRef(1); // Referencia "viva" de la página

  
  // EPUB state
  const epubViewerRef = useRef(null);
  const epubBookRef = useRef(null);
  const [rendition, setRendition] = useState(null);
  const [epubReady, setEpubReady] = useState(false);
  const [epubMetadata, setEpubMetadata] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [epubPageNumber, setEpubPageNumber] = useState(1);
  const [totalEpubPages, setTotalEpubPages] = useState(0);
  
  // Anotaciones
  const [notes, setNotes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  
  // UI
  const [showSidebar, setShowSidebar] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  
  const [sessionStartTime, setSessionStartTime] = useState(null);
  
//  REFERENCIA PARA EL TIMER DE GUARDADO
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    loadBook();
    loadAllAnnotations();
    setSessionStartTime(new Date());
    
    return () => {
      if (sessionStartTime) {
        recordSession();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  // Hook para inicializar EPUB
  useEffect(() => {
    let isMounted = true;

    if (book?.epubFileUrl && epubViewerRef.current && !rendition) {
      initEpubViewer();
    }

    return () => {
      isMounted = false;
      if (rendition) {
        console.log('🧹 Limpiando visor EPUB...');
        try {
          rendition.destroy();
        } catch (e) {
          console.warn('Error al limpiar rendition', e);
        }
        setRendition(null);
        setEpubReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.epubFileUrl, epubViewerRef.current]);

  // ✅ FUNCIÓN QUE MANEJA EL CAMBIO DE PÁGINA (Desde Adobe)
  const handleAdobePageChange = (page) => {
    console.log(`📄 Adobe reporta página: ${page}`);
    
    // 1. Actualizar estado visual localmente
    setPageNumber(page);
    currentPageRef.current = page; //actualiza referencia

    // 2. Debounce: Limpiar timer anterior si el usuario sigue pasando páginas rápido
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // 3. Configurar nuevo timer: Guardar en BD después de 1 segundo de inactividad
    saveTimeoutRef.current = setTimeout(() => {
      console.log(`💾 Guardando progreso en BD: Página ${page}`);
      updateProgress(page);
    }, 1000);
  };

  const loadBook = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/library/books/${params.id}`);
      const bookData = response.data.data.userBook.book;
      setBook(bookData);

      const savedPage = bookData.userBook?.currentPage || 1;
      setPageNumber(savedPage);

      if (!bookData.pdfFileUrl && !bookData.epubFileUrl) {
        toast.error('Este libro no tiene archivo para leer');
        setTimeout(() => router.push(`/book/${params.id}`), 2000);
      }
    } catch (error) {
      console.error('Error loading book:', error);
      toast.error('Error al cargar el libro');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadAllAnnotations = async () => {
    try {
      setLoadingAnnotations(true);
      const [notesRes, bookmarksRes] = await Promise.all([
        api.get(`/api/library/books/${params.id}/notes`),
        api.get(`/api/library/books/${params.id}/bookmarks`),
      ]);

      setNotes(notesRes.data.data.notes || []);
      setBookmarks(bookmarksRes.data.data.bookmarks || []);
    } catch (error) {
      console.error('Error loading annotations:', error);
    } finally {
      setLoadingAnnotations(false);
    }
  };

  /*const recordSession = async () => {
    if (!sessionStartTime || !book) return;

    try {
      const endTime = new Date();
      const durationMinutes = Math.floor((endTime - sessionStartTime) / 60000);

      if (durationMinutes < 1) return;
      const lastPageRead = currentPageRef.current;

      //const currentPage = book.epubFileUrl ? epubPageNumber : pageNumber;

      await api.post(`/api/library/books/${params.id}/reading-session`, {
        startPage: 1,
        endPage: currentPage,
        startTime: sessionStartTime.toISOString(),
        endTime: endTime.toISOString(),
        deviceType: 'web',
      });

      console.log(`✅ Sesión registrada: Pág 1 a ${lastPageRead} (${durationMinutes} min)`);
    } catch (error) {
      console.error('Error recording session:', error);
    }
  };
  const recordSession = async () => {
  if (!book) return;

  const now = Date.now();
  const minutesRead = Math.floor((now - sessionStartTime.current) / 60000);

  if (minutesRead < 1) return;

  try {
    await api.post('/api/gamification/pages', {
      bookId: book.id,
      pagesRead: 0, // ✅ Cambiar según tu lógica
      minutesRead,
    });

    sessionStartTime.current = now;
  } catch (error) {
    console.error('Error recording session:', error);
  }
};

  // ✅ 3. EPUB VIEWER LÓGICA (ArrayBuffer + Scrolled)
  const initEpubViewer = async () => {
    try {
      if (rendition || !epubViewerRef.current) return;

      console.log('📖 Inicializando EPUB viewer...');
      
      // A. Descarga Manual (ArrayBuffer) - Soluciona error 404 de Cloudinary
      const response = await fetch(book.epubFileUrl);
      if (!response.ok) throw new Error('Error descarga');
      const arrayBuffer = await response.arrayBuffer();

      const ePub = (await import('epubjs')).default;
      const epubBook = ePub(arrayBuffer); // Cargamos el buffer, no la URL
      epubBookRef.current = epubBook;

      await epubBook.ready;

      // B. Metadatos
      const metadata = await epubBook.loaded.metadata;
      const navigation = await epubBook.loaded.navigation;
      
      setEpubMetadata({
        title: metadata.title || book.titulo,
        toc: navigation.toc,
        numberOfPages: 100 // Valor por defecto si no viene en metadata
      });

      // C. Renderizado (Modo Scrolled para mejor compatibilidad)
      const newRendition = epubBook.renderTo(epubViewerRef.current, {
        width: '100%',
        height: '100%',
        flow: 'scrolled', // 'paginated' si prefieres pasar páginas
        manager: 'continuous',
        allowScriptedContent: false,
      });

      // D. Tracking de Progreso
      newRendition.on('relocated', (location) => {
        setCurrentLocation(location);
        
        
        // Calcular porcentaje
        const percentage = location.start.percentage || 0;
        // Estimar página actual basada en porcentaje
        const estimatedPage = Math.floor(percentage * (metadata.numberOfPages || 100)) || 1;
        
        console.log(`📍 Progreso: ${(percentage * 100).toFixed(1)}% (Pág est: ${estimatedPage})`);
        
        setEpubPageNumber(estimatedPage);
        currentPageRef.current = estimatedPage; //actualiza referencia 
        updateProgress(estimatedPage); // Guardar en backend
      });

      // E. Estilos Forzados (Modo Oscuro)
      newRendition.themes.register('dark', {
        body: { 
          'color': '#e5e5e5 !important', // Texto claro
          'background': '#171717 !important', // Fondo oscuro
          'font-family': 'Helvetica, Arial, sans-serif !important',
          'font-size': '18px !important',
          'line-height': '1.6 !important',
          'padding': '40px !important', 
        },
        'p': { 
          'color': '#e5e5e5 !important',
          'font-size': '1.1em !important' 
        },
        'h1, h2, h3': { 'color': '#ffffff !important' },
        'a': { 'color': '#60a5fa !important' },
        'img': { 'max-width': '100% !important' }
      });

      await newRendition.display();
      newRendition.themes.select('dark');

      setRendition(newRendition);
      setEpubReady(true);

    } catch (error) {
      console.error('❌ Error EPUB:', error);
      toast.error('Error al abrir el libro');
    }
  };

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!rendition) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        rendition.prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        rendition.next();
      }
    };

    if (rendition) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [rendition]);

  const goToPrevPageEpub = () => {
    if (rendition) rendition.prev();
  };

  const goToNextPageEpub = () => {
    if (rendition) rendition.next();
  };

  const pdfFile = useMemo(() => {
    if (!book?.pdfFileUrl) return null;
    return book.pdfFileUrl;
  }, [book?.pdfFileUrl]);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    toast.success(`PDF cargado: ${numPages} páginas`);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error('❌ Error loading PDF:', error);
    toast.error('Error al cargar el PDF');
  }, []);

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const updateProgress = useCallback(async (page) => {
    try {
      await api.put(`/api/library/books/${params.id}/progress`, {
        currentPage: page,
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [params.id]);

  // Debounce para guardar progreso
  useEffect(() => {
    const pageToSave = book?.epubFileUrl ? epubPageNumber : pageNumber;
    
    if (pageToSave) {
      const debounce = setTimeout(() => {
        updateProgress(pageToSave);
      }, 1000);
      return () => clearTimeout(debounce);
    }
  }, [pageNumber, epubPageNumber, book, updateProgress]);

  // Helper para obtener página actual
  const getCurrentPage = () => {
    if (book?.epubFileUrl) {
      return epubPageNumber;
    }
    return pageNumber;
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      toast.error('Escribe una nota');
      return;
    }

    try {
      const response = await api.post(`/api/library/books/${params.id}/notes`, {
        content: noteContent,
        page: getCurrentPage(),
        type: 'NOTE',
      });

      const newNote = response.data.data.note;
      setNotes([...notes, newNote]);
      toast.success('Nota guardada');
      setNoteContent('');
      setShowNoteModal(false);
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Error al guardar nota');
    }
  };

  const handleEditNote = async () => {
    if (!noteContent.trim()) return;

    try {
      const response = await api.put(`/api/library/notes/${editingNote.id}`, {
        content: noteContent,
      });

      const updatedNote = response.data.data.note;
      setNotes(notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
      toast.success('Nota actualizada');
      setEditingNote(null);
      setNoteContent('');
      setShowNoteModal(false);
    } catch (error) {
      toast.error('Error al actualizar nota');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await api.delete(`/api/library/notes/${noteId}`);
      setNotes(notes.filter((n) => n.id !== noteId));
      toast.success('Nota eliminada');
    } catch (error) {
      toast.error('Error al eliminar nota');
    }
  };

  const handleAddBookmark = async () => {
    try {
      const response = await api.post(`/api/library/books/${params.id}/bookmarks`, {
        page: getCurrentPage(),
        title: `Página ${getCurrentPage()} - ${new Date().toLocaleString()}`,
      });

      const newBookmark = response.data.data.bookmark;
      setBookmarks([...bookmarks, newBookmark]);
      toast.success('Marcador agregado');
    } catch (error) {
      toast.error('Error al crear marcador');
    }
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    try {
      await api.delete(`/api/library/bookmarks/${bookmarkId}`);
      setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
      toast.success('Marcador eliminado');
    } catch (error) {
      toast.error('Error al eliminar marcador');
    }
  };

  const allAnnotations = [
    ...notes.map((n) => ({ ...n, source: 'note' })),
    ...bookmarks.map((b) => ({ ...b, source: 'bookmark' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-white font-ui">Cargando libro...</p>
        </div>
      </div>
    );
  }

  if (!book) return null;

  const isPdf = book.pdfFileUrl;
  const isEpub = book.epubFileUrl && !book.pdfFileUrl;

  return (
    <>
      <Toaster position="top-center" />

      <div className="min-h-screen bg-neutral-900 text-white">
        {/* Header *//*}
        <header className="bg-neutral-800 border-b border-neutral-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => {
                recordSession();
                router.push(`/book/${params.id}`);
              }}
              className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-heading text-lg line-clamp-1">{book.titulo}</h1>
              <p className="text-sm text-neutral-400 font-ui line-clamp-1">{book.autor}</p>
              
              {/* Información de progreso EPUB *//*}
              {isEpub && epubMetadata && (
                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                  <Book className="w-3 h-3" />
                  <span>{epubMetadata.language || 'EPUB'}</span>
                  {/* Mostramos página estimada *//*}
                  <span>• Pág. aprox. {epubPageNumber}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleAddBookmark} className="p-2 hover:bg-neutral-700 rounded-lg transition-colors" title="Marcador">
              <BookmarkPlus className="w-5 h-5" />
            </button>
            
            <button onClick={() => setShowNoteModal(true)} className="p-2 hover:bg-neutral-700 rounded-lg transition-colors" title="Nota">
              <StickyNote className="w-5 h-5" />
            </button>

            {isPdf && (
              <>
                <button onClick={zoomOut} disabled={scale <= 0.5} className="p-2 hover:bg-neutral-700 rounded-lg transition-colors">
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-sm font-ui px-2 min-w-[60px] text-center">{Math.round(scale * 100)}%</span>
                <button onClick={zoomIn} disabled={scale >= 3.0} className="p-2 hover:bg-neutral-700 rounded-lg transition-colors">
                  <ZoomIn className="w-5 h-5" />
                </button>
              </>
            )}

            <button onClick={() => setShowSidebar(!showSidebar)} className={`p-2 hover:bg-neutral-700 rounded-lg transition-colors relative ${showSidebar ? 'bg-neutral-700' : ''}`}>
              <Menu className="w-5 h-5" />
              {allAnnotations.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-ui">
                  {allAnnotations.length}
                </span>
              )}
            </button>

            <a href={book.pdfFileUrl || book.epubFileUrl} download className="p-2 hover:bg-neutral-700 rounded-lg transition-colors">
              <Download className="w-5 h-5" />
            </a>
          </div>
        </header>

        <div className="flex h-[calc(100vh-60px)]">
          {/* Contenido principal *//*}
          <div className="flex-1 overflow-hidden bg-neutral-900">
            {isPdf ? (
            // ✅ COMPONENTE ACTUALIZADO
            <AdobePdfViewer 
              url={book.pdfFileUrl} 
              title={book.titulo}
              initialPage={book.userBook?.currentPage || 1}
              onPageChange={handleAdobePageChange}
            />
            ) : isEpub ? (
              <div className="h-full flex flex-col">
                {/* EPUB Viewer Container *//*}
                <div className="flex-1 bg-neutral-900 relative overflow-hidden">
                  {!epubReady && (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                    </div>
                  )}
                  
                  {/* AREA DE LECTURA - Scroll Vertical *//*}
                  <div 
                    ref={epubViewerRef} 
                    className="w-full h-full overflow-y-auto"
                    style={{ 
                       height: 'calc(100vh - 60px)',
                       width: '100%',
                       display: 'block'
                    }} 
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-neutral-400 font-ui">No hay archivo disponible</p>
              </div>
            )}
          </div>

          {/* Sidebar *//*}
          {showSidebar && (
            <div className="w-80 bg-neutral-800 border-l border-neutral-700 overflow-y-auto flex-shrink-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-heading">Anotaciones ({allAnnotations.length})</h2>
                  <button onClick={() => setShowSidebar(false)} className="p-2 hover:bg-neutral-700 rounded-lg">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {loadingAnnotations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                  </div>
                ) : allAnnotations.length === 0 ? (
                  <div className="text-center py-12">
                    <StickyNote className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-400 text-sm font-ui">No hay anotaciones todavía</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allAnnotations.map((item) => (
                      <div key={`${item.source}-${item.id}`} className="bg-neutral-700 rounded-lg p-3 hover:bg-neutral-600 transition-colors group">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {item.source === 'note' && <StickyNote className="w-4 h-4 text-blue-400" />}
                            {item.source === 'bookmark' && <BookmarkPlus className="w-4 h-4 text-green-400" />}
                            <span className="text-xs text-neutral-400 font-ui">{new Date(item.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.source === 'note' && (
                              <button onClick={() => { setEditingNote(item); setNoteContent(item.content); setShowNoteModal(true); }} className="p-1 hover:bg-neutral-500 rounded">
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => { if (confirm('¿Eliminar?')) item.source === 'note' ? handleDeleteNote(item.id) : handleDeleteBookmark(item.id); }} className="p-1 hover:bg-red-500 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {item.content && <p className="text-sm text-white font-ui break-words">{item.content}</p>}
                        {item.title && <p className="text-sm text-white font-ui font-medium">{item.title}</p>}
                        <p className="text-xs text-neutral-500 mt-1">Pág. {item.page}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Nota *//*}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30 p-4">
            <div className="bg-neutral-800 rounded-lg p-6 max-w-md w-full border border-neutral-700">
              <h3 className="text-lg font-heading mb-4">{editingNote ? 'Editar Nota' : 'Agregar Nota'}</h3>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg font-ui focus:border-primary-500 focus:outline-none text-white resize-none"
                rows="6"
                placeholder="Escribe tu nota aquí..."
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <button onClick={() => { setShowNoteModal(false); setNoteContent(''); setEditingNote(null); }} className="btn-outline flex-1">Cancelar</button>
                <button onClick={editingNote ? handleEditNote : handleAddNote} disabled={!noteContent.trim()} className="btn-primary flex-1 disabled:opacity-50">{editingNote ? 'Actualizar' : 'Guardar'}</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
// src/app/reader/[id]/page.jsx

'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  ZoomIn,
  ZoomOut,
  BookmarkPlus,
  StickyNote,
  Menu,
  X,
  Edit,
  Trash2,
  Loader2,
  Book,
} from 'lucide-react';
import dynamic from 'next/dynamic';
import api from '@/lib/api';
import toast, { Toaster } from 'react-hot-toast';

 // CONFIGURACIÓN DEL WORKER (Crucial para que no falle)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

//  Importar configuración de PDF
import '../../../lib/pdfConfig';

// Importar estilos de react-pdf
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// ✅ Cargar react-pdf dinámicamente
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { ssr: false }
);
const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

export default function ReaderPage() {
  const router = useRouter();
  const params = useParams();
  
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingAnnotations, setLoadingAnnotations] = useState(false);
  
  // PDF state
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  
  // EPUB state
  const epubViewerRef = useRef(null);
  const epubBookRef = useRef(null);
  const [rendition, setRendition] = useState(null);
  const [epubReady, setEpubReady] = useState(false);
  const [epubMetadata, setEpubMetadata] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [epubPageNumber, setEpubPageNumber] = useState(1);
  const [totalEpubPages, setTotalEpubPages] = useState(0);
  
  // Anotaciones
  const [notes, setNotes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  
  // UI
  const [showSidebar, setShowSidebar] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  
  const [sessionStartTime, setSessionStartTime] = useState(null);

  useEffect(() => {
    loadBook();
    loadAllAnnotations();
    setSessionStartTime(new Date());
    
    return () => {
      if (sessionStartTime) {
        recordSession();
      }
      if (rendition) {
        try {
          rendition.destroy();
        } catch (error) {
          console.error('Error destroying rendition:', error);
        }
      }
    };
  }, [params.id]);

  useEffect(() => {
    let isMounted = true;

    // Solo iniciar si tenemos URL, referencia al div y NO tenemos ya un rendition
    if (book?.epubFileUrl && epubViewerRef.current && !rendition) {
      initEpubViewer();
    }

    // Función de limpieza (Cleanup)
    return () => {
      isMounted = false;
      if (rendition) {
        console.log('🧹 Limpiando visor EPUB...');
        try {
          rendition.destroy(); // Destruir el renderizado
        } catch (e) {
          console.warn('Error al limpiar rendition', e);
        }
        setRendition(null);
        setEpubReady(false);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book?.epubFileUrl, epubViewerRef.current]); // Quitamos 'rendition' de las dependencias para evitar bucles

  const loadBook = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/library/books/${params.id}`);
      const bookData = response.data.data.userBook.book;
      setBook(bookData);

      const savedPage = bookData.userBook?.currentPage || 1;
      setPageNumber(savedPage);

      if (!bookData.pdfFileUrl && !bookData.epubFileUrl) {
        toast.error('Este libro no tiene archivo para leer');
        setTimeout(() => router.push(`/book/${params.id}`), 2000);
      }
    } catch (error) {
      console.error('Error loading book:', error);
      toast.error('Error al cargar el libro');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadAllAnnotations = async () => {
    try {
      setLoadingAnnotations(true);
      const [notesRes, bookmarksRes] = await Promise.all([
        api.get(`/api/library/books/${params.id}/notes`),
        api.get(`/api/library/books/${params.id}/bookmarks`),
      ]);

      setNotes(notesRes.data.data.notes || []);
      setBookmarks(bookmarksRes.data.data.bookmarks || []);
    } catch (error) {
      console.error('Error loading annotations:', error);
    } finally {
      setLoadingAnnotations(false);
    }
  };

  const recordSession = async () => {
    if (!sessionStartTime || !book) return;

    try {
      const endTime = new Date();
      const durationMinutes = Math.floor((endTime - sessionStartTime) / 60000);

      if (durationMinutes < 1) return;

      const currentPage = book.epubFileUrl ? epubPageNumber : pageNumber;

      await api.post(`/api/library/books/${params.id}/reading-session`, {
        startPage: 1,
        endPage: currentPage,
        startTime: sessionStartTime.toISOString(),
        endTime: endTime.toISOString(),
        deviceType: 'web',
      });

      console.log('✅ Sesión de lectura registrada');
    } catch (error) {
      console.error('Error recording session:', error);
    }
  };


  // ✅ EPUB VIEWER CORREGIDO PARA REACT 19 + CLOUDINARY
  const initEpubViewer = async () => {
    try {
      if (rendition || !epubViewerRef.current) return;

      console.log('📖 Inicializando EPUB viewer...');
      
      // 1. Descarga Manual (ArrayBuffer)
      const response = await fetch(book.epubFileUrl);
      if (!response.ok) throw new Error('Error descarga');
      const arrayBuffer = await response.arrayBuffer();

      const ePub = (await import('epubjs')).default;
      const epubBook = ePub(arrayBuffer);
      epubBookRef.current = epubBook;

      await epubBook.ready;

      // Metadatos
      const metadata = await epubBook.loaded.metadata;
      const navigation = await epubBook.loaded.navigation;
      setEpubMetadata({
        title: metadata.title || book.titulo,
        toc: navigation.toc,
      });

      // 2. RENDERIZADO MEJORADO
      // Usamos 'scrolled' primero para asegurar que se vea el contenido verticalmente
      // Si prefieres paginado (izquierda-derecha), cambia flow a 'paginated' y manager a 'default'
      const newRendition = epubBook.renderTo(epubViewerRef.current, {
        width: '100%',
        height: '100%',
        flow: 'scrolled', // ⚠️ CAMBIO: Scrolled evita que el texto se corte
        manager: 'continuous',
        allowScriptedContent: false,
      });

      // 3. TRACKING DE PROGRESO (CFI en lugar de páginas)
      newRendition.on('relocated', (location) => {
        setCurrentLocation(location);
        
        // Guardar progreso usando porcentajes (más fiable que números de página en EPUB)
        const percentage = location.start.percentage || 0;
        // Convertir porcentaje a "página" aproximada para tu backend
        const estimatedPage = Math.floor(percentage * (metadata.numberOfPages || 100)) || 1;
        
        console.log(`📍 Progreso: ${(percentage * 100).toFixed(1)}%`);
        
        setEpubPageNumber(estimatedPage);
        
        // Guardar en base de datos (Debounce manual)
        updateProgress(estimatedPage);
      });

      // 4. ESTILOS FORZADOS (Para ver el texto sí o sí)
      newRendition.themes.register('dark', {
        body: { 
          'color': '#e5e5e5 !important', 
          'background': '#171717 !important',
          'font-family': 'Helvetica, Arial, sans-serif !important',
          'font-size': '18px !important',
          'line-height': '1.6 !important',
          'padding': '40px !important', 
        },
        'p': { 
          'color': '#e5e5e5 !important',
          'font-size': '1.1em !important' 
        },
        'h1, h2, h3': { 'color': '#ffffff !important' },
        'a': { 'color': '#60a5fa !important' },
        'img': { 'max-width': '100% !important' } // Evitar imágenes gigantes
      });

      await newRendition.display();
      newRendition.themes.select('dark');

      setRendition(newRendition);
      setEpubReady(true);

    } catch (error) {
      console.error('❌ Error EPUB:', error);
      toast.error('Error al abrir el libro');
    }
  };

/*
  // ✅ EPUB VIEWER MEJORADO Y CORREGIDO
  const initEpubViewer = async () => {
    try {
      console.log('📖 Inicializando EPUB viewer...');
      
      if (!epubViewerRef.current) {
        console.error('❌ Referencia del contenedor no disponible');
        toast.error('Error: Contenedor del visor no encontrado');
        return;
      }
      
      const ePub = (await import('epubjs')).default;
      
      console.log('📚 Cargando EPUB desde:', book.epubFileUrl);
      
      const epubBook = ePub(book.epubFileUrl);
      epubBookRef.current = epubBook;

      // ✅ Esperar a que el libro esté listo
      await epubBook.ready;
      
      // ✅ Extraer metadatos
      const metadata = await epubBook.loaded.metadata;
      const navigation = await epubBook.loaded.navigation;
      
      setEpubMetadata({
        title: metadata.title || book.titulo,
        creator: metadata.creator || book.autor,
        description: metadata.description,
        publisher: metadata.publisher,
        language: metadata.language,
        toc: navigation.toc,
      });

      console.log('📖 Metadatos EPUB:', metadata);
      
      // ✅ Crear rendition con configuración mejorada
      const newRendition = epubBook.renderTo(epubViewerRef.current, {
        width: '100%',
        height: '100%',
        spread: 'none',
        flow: 'paginated',
      });

      // ✅ Rastrear ubicación y páginas
      newRendition.on('relocated', (location) => {
        setCurrentLocation(location);
        
        // Calcular número de página aproximado
        const currentPage = location.start.displayed.page || 1;
        const totalPages = location.start.displayed.total || 1;
        
        setEpubPageNumber(currentPage);
        setTotalEpubPages(totalPages);
        
        console.log(`📍 Página ${currentPage} de ${totalPages}`);
      });

      // ✅ Aplicar estilos mejorados para legibilidad
      newRendition.themes.register('custom', {
        body: {
          'color': '#1a1a1a !important',
          'background': '#ffffff !important',
          'font-family': '"Georgia", "Times New Roman", serif !important',
          'font-size': '18px !important',
          'line-height': '1.8 !important',
          'padding': '40px 60px !important',
          'max-width': '800px !important',
          'margin': '0 auto !important',
        },
        'p': {
          'margin-bottom': '1.2em !important',
          'text-align': 'justify !important',
        },
        'h1, h2, h3, h4, h5, h6': {
          'margin-top': '1.5em !important',
          'margin-bottom': '0.8em !important',
          'font-weight': 'bold !important',
          'color': '#2c3e50 !important',
        },
        'a': {
          'color': '#3498db !important',
        },
      });
      
      newRendition.themes.select('custom');
      
      // ✅ Mostrar el libro
      await newRendition.display();
      
      setRendition(newRendition);
      setEpubReady(true);
      
      console.log('✅ EPUB cargado correctamente');
      toast.success('Libro EPUB cargado');
      
    } catch (error) {
      console.error('❌ Error loading EPUB:', error);
      toast.error('Error al cargar el EPUB: ' + error.message);
    }
  };*/
/*
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!rendition) return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        rendition.prev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        rendition.next();
      }
    };

    if (rendition) {
      document.addEventListener('keydown', handleKeyPress);
      return () => document.removeEventListener('keydown', handleKeyPress);
    }
  }, [rendition]);

  const goToPrevPageEpub = () => {
    if (rendition) {
      rendition.prev();
    }
  };

  const goToNextPageEpub = () => {
    if (rendition) {
      rendition.next();
    }
  };

  const pdfFile = useMemo(() => {
    if (!book?.pdfFileUrl) return null;
    return book.pdfFileUrl;
  }, [book?.pdfFileUrl]);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    console.log('✅ PDF cargado exitosamente:', numPages, 'páginas');
    toast.success(`PDF cargado: ${numPages} páginas`);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error('❌ Error loading PDF:', error);
    toast.error('Error al cargar el PDF');
  }, []);

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages || 1));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const updateProgress = useCallback(async (page) => {
    try {
      await api.put(`/api/library/books/${params.id}/progress`, {
        currentPage: page,
      });
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  }, [params.id]);

  useEffect(() => {
    if (pageNumber && book?.pdfFileUrl) {
      const debounce = setTimeout(() => {
        updateProgress(pageNumber);
      }, 1000);
      return () => clearTimeout(debounce);
    }
  }, [pageNumber, book, updateProgress]);

  useEffect(() => {
    if (epubPageNumber && book?.epubFileUrl) {
      const debounce = setTimeout(() => {
        updateProgress(epubPageNumber);
      }, 1000);
      return () => clearTimeout(debounce);
    }
  }, [epubPageNumber, book, updateProgress]);

  // ✅ CORRECCIÓN: Usar número de página simple para backend
  const getCurrentPage = () => {
    if (book?.epubFileUrl) {
      return epubPageNumber;
    }
    return pageNumber;
  };

  const handleAddNote = async () => {
    if (!noteContent.trim()) {
      toast.error('Escribe una nota');
      return;
    }

    try {
      const response = await api.post(`/api/library/books/${params.id}/notes`, {
        content: noteContent,
        page: getCurrentPage(), // ✅ Ahora siempre es un número
        type: 'NOTE',
      });

      const newNote = response.data.data.note;
      setNotes([...notes, newNote]);
      toast.success('Nota guardada');
      setNoteContent('');
      setShowNoteModal(false);
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Error al guardar nota: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEditNote = async () => {
    if (!noteContent.trim()) {
      toast.error('Escribe una nota');
      return;
    }

    try {
      const response = await api.put(`/api/library/notes/${editingNote.id}`, {
        content: noteContent,
      });

      const updatedNote = response.data.data.note;
      setNotes(notes.map((n) => (n.id === updatedNote.id ? updatedNote : n)));
      toast.success('Nota actualizada');
      setEditingNote(null);
      setNoteContent('');
      setShowNoteModal(false);
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Error al actualizar nota');
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await api.delete(`/api/library/notes/${noteId}`);
      setNotes(notes.filter((n) => n.id !== noteId));
      toast.success('Nota eliminada');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Error al eliminar nota');
    }
  };

  const handleAddBookmark = async () => {
    try {
      const response = await api.post(`/api/library/books/${params.id}/bookmarks`, {
        page: getCurrentPage(), // ✅ Ahora siempre es un número
        title: `Página ${getCurrentPage()} - ${new Date().toLocaleString()}`,
      });

      const newBookmark = response.data.data.bookmark;
      setBookmarks([...bookmarks, newBookmark]);
      toast.success('Marcador agregado');
    } catch (error) {
      console.error('Error creating bookmark:', error);
      toast.error('Error al crear marcador: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteBookmark = async (bookmarkId) => {
    try {
      await api.delete(`/api/library/bookmarks/${bookmarkId}`);
      setBookmarks(bookmarks.filter((b) => b.id !== bookmarkId));
      toast.success('Marcador eliminado');
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      toast.error('Error al eliminar marcador');
    }
  };

  const allAnnotations = [
    ...notes.map((n) => ({ ...n, source: 'note' })),
    ...bookmarks.map((b) => ({ ...b, source: 'bookmark' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          <p className="mt-4 text-white font-ui">Cargando libro...</p>
        </div>
      </div>
    );
  }

  if (!book) return null;

  const isPdf = book.pdfFileUrl;
  const isEpub = book.epubFileUrl && !book.pdfFileUrl;

  return (
    <>
      <Toaster position="top-center" />

      <div className="min-h-screen bg-neutral-900 text-white">
        {/* Header *///}
/*
        <header className="bg-neutral-800 border-b border-neutral-700 px-4 py-3 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <button
              onClick={() => {
                recordSession();
                router.push(`/book/${params.id}`);
              }}
              className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="font-heading text-lg line-clamp-1">{book.titulo}</h1>
              <p className="text-sm text-neutral-400 font-ui line-clamp-1">{book.autor}</p>
              
              {/* ✅ Mostrar metadatos de EPUB *///}
            /*  {isEpub && epubMetadata && (
                <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1">
                  <Book className="w-3 h-3" />
                  <span>{epubMetadata.language || 'EPUB'}</span>
                  {totalEpubPages > 0 && (
                    <span>• Pág. {epubPageNumber}/{totalEpubPages}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAddBookmark}
              className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
              title="Agregar marcador"
            >
              <BookmarkPlus className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setShowNoteModal(true)}
              className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
              title="Agregar nota"
            >
              <StickyNote className="w-5 h-5" />
            </button>

            {isPdf && (
              <>
                <button
                  onClick={zoomOut}
                  disabled={scale <= 0.5}
                  className="p-2 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Alejar"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-sm font-ui px-2 min-w-[60px] text-center">
                  {Math.round(scale * 100)}%
                </span>
                <button
                  onClick={zoomIn}
                  disabled={scale >= 3.0}
                  className="p-2 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50"
                  title="Acercar"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </>
            )}

            <button
              onClick={() => setShowSidebar(!showSidebar)}
              className={`p-2 hover:bg-neutral-700 rounded-lg transition-colors relative ${
                showSidebar ? 'bg-neutral-700' : ''
              }`}
              title="Anotaciones"
            >
              <Menu className="w-5 h-5" />
              {allAnnotations.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-ui">
                  {allAnnotations.length}
                </span>
              )}
            </button>

            <a
              href={book.pdfFileUrl || book.epubFileUrl}
              download={`${book.titulo}.${isPdf ? 'pdf' : 'epub'}`}
              className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
              title="Descargar"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        </header>

        <div className="flex h-[calc(100vh-60px)]">
          {/* Contenido principal *///}
         /* <div className="flex-1 overflow-hidden bg-neutral-900">
            {isPdf ? (
              <div className="h-full flex flex-col items-center py-8 overflow-auto">
                {/* Controles PDF *///}
               /* <div className="mb-4 flex items-center gap-4 bg-neutral-800 px-6 py-3 rounded-lg sticky top-4 z-10 shadow-lg">
                  <button
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1}
                    className="p-2 hover:bg-neutral-700 rounded transition-colors disabled:opacity-50"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="font-ui text-sm min-w-[120px] text-center">
                    Página {pageNumber} de {numPages || '...'}
                  </span>
                  <button
                    onClick={goToNextPage}
                    disabled={pageNumber >= (numPages || 1)}
                    className="p-2 hover:bg-neutral-700 rounded transition-colors disabled:opacity-50"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* PDF Viewer *///}
              /*  <div className="shadow-2xl">
                  <Document
                    file={pdfFile}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    loading={
                      <div className="flex items-center justify-center h-96 w-[800px]">
                        <div className="text-center">
                          <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-2" />
                          <p className="text-neutral-400 font-ui">Cargando PDF...</p>
                        </div>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={pageNumber}
                      scale={scale}
                      renderTextLayer={true}
                      renderAnnotationLayer={false}
                      className="shadow-2xl"
                    />
                  </Document>
                </div>
              </div>
            ) : isEpub ? (
              <div className="h-full flex flex-col">
                {/* Controles EPUB *//*}
                <div className="flex items-center justify-center gap-4 bg-neutral-800 px-6 py-3 shadow-lg flex-shrink-0">
                  <button
                    onClick={goToPrevPageEpub}
                    disabled={!epubReady}
                    className="p-2 hover:bg-neutral-700 rounded transition-colors disabled:opacity-50"
                    title="Anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="font-ui text-sm">
                    {epubReady 
                      ? (totalEpubPages > 0 
                          ? `Página ${epubPageNumber} de ${totalEpubPages}` 
                          : 'Usa las flechas ← → para navegar')
                      : 'Cargando EPUB...'}
                  </span>
                  <button
                    onClick={goToNextPageEpub}
                    disabled={!epubReady}
                    className="p-2 hover:bg-neutral-700 rounded transition-colors disabled:opacity-50"
                    title="Siguiente"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* ✅ EPUB Viewer CORREGIDO - más grande y con overflow *//*}
                <div className="flex-1 bg-neutral-900 overflow-hidden">
                  <div 
                    ref={epubViewerRef}
                    className="w-full h-full"
                    style={{ minHeight: '100%' }}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-neutral-400 font-ui">No hay archivo disponible</p>
              </div>
            )}
          </div>

          {/* Sidebar *//*}
          {showSidebar && (
            <div className="w-80 bg-neutral-800 border-l border-neutral-700 overflow-y-auto flex-shrink-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-heading">
                    Anotaciones ({allAnnotations.length})
                  </h2>
                  <button
                    onClick={() => setShowSidebar(false)}
                    className="p-2 hover:bg-neutral-700 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {loadingAnnotations ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
                  </div>
                ) : allAnnotations.length === 0 ? (
                  <div className="text-center py-12">
                    <StickyNote className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                    <p className="text-neutral-400 text-sm font-ui">
                      No hay anotaciones todavía
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allAnnotations.map((item) => (
                      <div
                        key={`${item.source}-${item.id}`}
                        className="bg-neutral-700 rounded-lg p-3 hover:bg-neutral-600 transition-colors group"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {item.source === 'note' && (
                              <StickyNote className="w-4 h-4 text-blue-400" />
                            )}
                            {item.source === 'bookmark' && (
                              <BookmarkPlus className="w-4 h-4 text-green-400" />
                            )}
                            <span className="text-xs text-neutral-400 font-ui">
                              {new Date(item.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.source === 'note' && (
                              <button
                                onClick={() => {
                                  setEditingNote(item);
                                  setNoteContent(item.content);
                                  setShowNoteModal(true);
                                }}
                                className="p-1 hover:bg-neutral-500 rounded transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (confirm('¿Eliminar esta anotación?')) {
                                  if (item.source === 'note') {
                                    handleDeleteNote(item.id);
                                  } else {
                                    handleDeleteBookmark(item.id);
                                  }
                                }
                              }}
                              className="p-1 hover:bg-red-500 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {item.content && (
                          <p className="text-sm text-white font-ui break-words">{item.content}</p>
                        )}
                        {item.title && item.source === 'bookmark' && (
                          <p className="text-sm text-white font-ui font-medium">{item.title}</p>
                        )}
                        <p className="text-xs text-neutral-500 mt-1">Pág. {item.page}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal para nota *//*}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-30 p-4">
            <div className="bg-neutral-800 rounded-lg p-6 max-w-md w-full border border-neutral-700">
              <h3 className="text-lg font-heading mb-4">
                {editingNote ? 'Editar Nota' : 'Agregar Nota'}
              </h3>
              <p className="text-sm text-neutral-400 mb-3 font-ui">
                {isEpub 
                  ? `Página ${epubPageNumber}${totalEpubPages > 0 ? ` de ${totalEpubPages}` : ''}`
                  : `Página ${pageNumber}${numPages ? ` de ${numPages}` : ''}`
                }
              </p>
              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-700 border border-neutral-600 rounded-lg font-ui focus:border-primary-500 focus:outline-none text-white resize-none"
                rows="6"
                placeholder="Escribe tu nota aquí..."
                autoFocus
              />
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => {
                    setShowNoteModal(false);
                    setNoteContent('');
                    setEditingNote(null);
                  }}
                  className="btn-outline flex-1"
                >
                  Cancelar
                </button>
                <button
                  onClick={editingNote ? handleEditNote : handleAddNote}
                  disabled={!noteContent.trim()}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {editingNote ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
} */