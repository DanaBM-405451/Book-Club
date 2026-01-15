/*
'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function PDFReader({ url, title, bookId, initialPage = 1, onClose }) {
  const containerRef = useRef(null);
  const [adobeReady, setAdobeReady] = useState(false);
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  // Variables para medir tiempo (usamos refs para que no reinicien el render)
  const startTimeRef = useRef(Date.now());
  const lastSaveTimeRef = useRef(Date.now());

  // 1. Cargar el SDK de Adobe
  useEffect(() => {
    if (window.AdobeDC) {
      setAdobeReady(true);
    } else {
      document.addEventListener('adobe_dc_view_sdk.ready', () => {
        setAdobeReady(true);
      });
    }
  }, []);

  // 2. Inicializar el Visor cuando Adobe esté listo
  useEffect(() => {
    if (adobeReady && containerRef.current) {
      const clientId = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID || 'TU_CLIENT_ID_DE_ADOBE_AQUI';
      
      const adobeDCView = new window.AdobeDC.View({
        clientId: clientId,
        divId: 'adobe-pdf-viewer',
      });

      const previewConfig = {
        content: { location: { url: url } },
        metaData: { fileName: title },
      };

      const viewerConfig = {
        embedMode: 'FULL_WINDOW',
        defaultViewMode: 'FIT_WIDTH',
        showAnnotationTools: true,
        showLeftHandPanel: true,
        showPageControls: true,
      };

      // Renderizar el PDF
      adobeDCView.previewFile(previewConfig, viewerConfig)
        .then((adobeViewer) => {
          
          // A. Ir a la última página leída
          if (initialPage > 1) {
            adobeViewer.getAPIs().then(apis => {
              apis.gotoLocation(parseInt(initialPage));
            });
          }

          // B. Registrar Evento de Cambio de Página
          adobeDCView.registerCallback(
            window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
            (event) => {
              if (event.type === 'PAGE_VIEW') {
                const newPage = event.data.pageNumber;
                setCurrentPage(newPage);
                handleProgressUpdate(newPage);
              }
            },
            { enablePDFAnalytics: true } // Necesario para detectar eventos
          );
        })
        .catch((error) => {
          console.error("Error cargando PDF:", error);
          toast.error("No se pudo cargar el documento.");
        });
    }
    
    // Cleanup al cerrar: Guardar tiempo final
    return () => {
      saveReadingSession();
    };
  }, [adobeReady, url]);

  // 3. Lógica para guardar progreso y tiempo
  const handleProgressUpdate = async (page) => {
    const now = Date.now();
    const timeSinceLastSave = (now - lastSaveTimeRef.current) / 1000; // Segundos

    // Guardar solo si han pasado más de 10 segundos o es un cambio de página significativo
    // para no saturar el backend.
    if (timeSinceLastSave > 10) {
      await saveToBackend(page);
      lastSaveTimeRef.current = now;
    }
  };

  const saveReadingSession = async () => {
    // Calcular tiempo total de esta sesión
    const sessionDurationMinutes = Math.round((Date.now() - startTimeRef.current) / 1000 / 60);
    
    if (sessionDurationMinutes > 0) {
      try {
        // Asumiendo que tienes un endpoint para registrar sesión o lo mandas en el update
        // Si no tienes endpoint de sesión, mándalo en el updateProgress normal si tu backend lo soporta
        console.log(`Guardando sesión: ${sessionDurationMinutes} minutos leídos`);
      } catch (e) {
        console.error("Error guardando sesión", e);
      }
    }
  };

  const saveToBackend = async (page) => {
    try {
      // Llamada a tu API Gateway -> Library Service
      await api.put(`/api/library/books/${bookId}/progress`, {
        currentPage: page
      });
      console.log("Progreso guardado:", page);
    } catch (error) {
      console.error("Error guardando progreso:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Carga del Script de Adobe */
      /*
      <Script 
        src="https://documentcloud.adobe.com/view-sdk/main.js" 
        strategy="lazyOnload" 
      />

      <div className="h-14 bg-neutral-900 text-white flex items-center justify-between px-4">
        <h3 className="font-medium truncate">{title}</h3>
        <button onClick={onClose} className="text-sm bg-neutral-700 px-3 py-1 rounded hover:bg-neutral-600">
          Cerrar y Guardar
        </button>
      </div>

      <div id="adobe-pdf-viewer" ref={containerRef} className="flex-1 w-full h-full" />
    </div>
  );
}*/