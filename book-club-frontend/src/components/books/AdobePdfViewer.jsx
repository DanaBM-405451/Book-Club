'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

export default function AdobePdfViewer({ url, title, initialPage = 1, onProgress }) {
  const viewerRef = useRef(null);

  useEffect(() => {
    const initAdobe = () => {
      if (window.AdobeDC && viewerRef.current) {
        // REEMPLAZA CON TU CLIENT ID DE ADOBE (Es gratis conseguir uno en su web)
        // Si usas localhost, este suele funcionar para pruebas:
        const clientId = process.env.NEXT_PUBLIC_ADOBE_CLIENT_ID || 'b932d001646247c49539316654877717'; 

        const adobeDCView = new window.AdobeDC.View({
          clientId: clientId,
          divId: 'adobe-pdf-div',
        });

        const previewFilePromise = adobeDCView.previewFile(
          {
            content: { location: { url: url } },
            metaData: { fileName: title || 'Libro' },
          },
          {
            embedMode: 'SIZED_CONTAINER',
            showAnnotationTools: true,
            showLeftHandPanel: true,
            showPageControls: true,
            defaultViewMode: 'FIT_WIDTH',
          }
        );

        previewFilePromise.then((adobeViewer) => {
          
          // 1. Ir a la página inicial guardada
          const startPage = parseInt(initialPage);
    if (startPage && startPage > 1) {
        console.log("📍 Restaurando lectura en página:", startPage);
        apis.gotoLocation(startPage)
          .catch(e => console.warn("Adobe no pudo saltar de página aún:", e));
    }

          // 2. Registrar Eventos de Cambio de Página
          const eventOptions = {
            listenOn: [window.AdobeDC.View.Enum.Events.PAGE_VIEW],
            enablePDFAnalytics: true // Necesario para que dispare eventos
          };

          adobeDCView.registerCallback(
            window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
            (event) => {
              if (event.type === 'PAGE_VIEW') {
                const pageNumber = event.data.pageNumber;
                // Avisamos al componente padre
                if (onProgress) onProgress(pageNumber);
              }
            },
            eventOptions
          );
        });
      }
    };

    // Si ya está cargado el script
    if (window.AdobeDC) {
      initAdobe();
    } else {
      document.addEventListener('adobe_dc_view_sdk.ready', initAdobe);
    }

    return () => {
      document.removeEventListener('adobe_dc_view_sdk.ready', initAdobe);
    };
  }, [url, title, initialPage]);

  return (
    <div className="w-full h-full bg-gray-100 relative">
      <Script
        src="https://documentcloud.adobe.com/view-sdk/main.js"
        strategy="lazyOnload"
      />
      <div id="adobe-pdf-div" ref={viewerRef} className="w-full h-full" />
    </div>
  );
}

/*  
'use client';

import { useEffect, useRef } from 'react';

export default function AdobePdfViewer({ url, title, initialPage = 1, onPageChange }) {
  const viewerRef = useRef(null);

  useEffect(() => {
    const initViewer = () => {
      if (!window.AdobeDC || !viewerRef.current) return;

      try {
        const adobeDCView = new window.AdobeDC.View({
          clientId: "40ad5c2c058b4b4eb9069f1a6cbc864b", // ⚠️ Asegúrate de que este sea el correcto
          divId: "adobe-pdf-container",
        });

        const previewPromise = adobeDCView.previewFile(
          {
            content: { location: { url: url } },
            metaData: { fileName: title || "Documento.pdf" }
          },
          {
            embedMode: "FULL_WINDOW",
            showAnnotationTools: true,
            showLeftHandPanel: true,
            showDownloadPDF: true,
            showPrintPDF: false,
            defaultViewMode: "FIT_WIDTH"
          }
        );

        // ✅ LÓGICA NUEVA: Escuchar cambio de página y saltar al inicio
        previewPromise.then((adobeViewer) => {
          // 1. Ir a la página guardada (si existe)
          adobeViewer.getAPIs().then((apis) => {
            if (initialPage > 1) {
              apis.gotoLocation(parseInt(initialPage));
            }
          });

          // 2. Registrar el evento de cambio de página
          const eventOptions = {
            listenOn: [window.AdobeDC.View.Enum.Events.PAGE_VIEW]
          };

          adobeDCView.registerCallback(
            window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
            (event) => {
                console.log("🔔 Evento Adobe:", event.type, event.data);
              if (event.type === 'PAGE_VIEW' && onPageChange) {
                // Adobe devuelve la página actual en event.data.pageNumber
                onPageChange(event.data.pageNumber);
              }
            },
            eventOptions
          );
        });

      } catch (error) {
        console.error("Error al inicializar Adobe Viewer:", error);
      }
    };

    if (window.AdobeDC) {
      initViewer();
    } else {
      document.addEventListener('adobe_dc_view_sdk.ready', initViewer);
      if (!document.getElementById('adobe-dc-view-sdk-script')) {
        const script = document.createElement('script');
        script.src = 'https://documentcloud.adobe.com/view-sdk/viewer.js';
        script.id = 'adobe-dc-view-sdk-script';
        document.body.appendChild(script);
      }
    }

    return () => {
      document.removeEventListener('adobe_dc_view_sdk.ready', initViewer);
    };
  }, [url, title]); // Quitamos initialPage para que no recargue al cambiar de página

  return (
    <div 
      id="adobe-pdf-container" 
      ref={viewerRef} 
      className="w-full h-full bg-white"
      style={{ height: 'calc(100vh - 60px)', width: '100%' }} 
    />
  );
}*/