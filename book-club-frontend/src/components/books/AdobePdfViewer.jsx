'use client';

import { useEffect, useRef } from 'react';

export default function AdobePdfViewer({ url, title, initialPage = 1, onPageChange }) {
  const viewerRef = useRef(null);
  const onPageChangeRef = useRef(onPageChange);
  const adobeViewerRef = useRef(null);

  useEffect(() => {
    onPageChangeRef.current = onPageChange;
  }, [onPageChange]);

  useEffect(() => {
    if (adobeViewerRef.current) return; // Prevenir recargas

    const initViewer = () => {
      if (!window.AdobeDC || !viewerRef.current) return;

      try {
        const adobeDCView = new window.AdobeDC.View({
          clientId: "40ad5c2c058b4b4eb9069f1a6cbc864b", //  CLIENT ID
          divId: "adobe-pdf-container",
        });

        adobeViewerRef.current = adobeDCView;

        const previewPromise = adobeDCView.previewFile(
          {
            content: { location: { url: url } },
            metaData: { 
              id: `book-${title ? title.replace(/[^a-z0-9]/gi, '-') : 'doc'}`,
              fileName: title || "Documento.pdf" 
            }
          },
          {
            // ✅ MODO FULL WINDOW (Se ve mejor y habilita más herramientas)
            embedMode: "FULL_WINDOW", 
            defaultViewMode: "FIT_WIDTH",
            
            // ✅ HERRAMIENTAS DE ANOTACIÓN ACTIVAS
            showAnnotationTools: true,
            enableAnnotationAPIs: true, 
            includePDFAnnotations: true,
            
            showLeftHandPanel: true,
            showDownloadPDF: true,
            showPrintPDF: false,
          }
        );

        previewPromise.then((adobeViewer) => {
          adobeViewer.getAPIs().then((apis) => {
            if (initialPage > 1) {
              apis.gotoLocation(parseInt(initialPage))
                .catch(e => console.warn(e));
            }
          });

          const eventOptions = {
            listenOn: [window.AdobeDC.View.Enum.Events.PAGE_VIEW]
          };

          adobeDCView.registerCallback(
            window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
            (event) => {
              if (event.type === 'PAGE_VIEW') {
                const page = event.data.pageNumber;
                if (onPageChangeRef.current) {
                  onPageChangeRef.current(page);
                }
              }
            },
            eventOptions
          );
        });
      } catch (error) {
        console.error("Error Adobe:", error);
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
  }, [url, title]); 

  return (
    <div 
      id="adobe-pdf-container" 
      ref={viewerRef} 
      className="w-full h-full" // Sin fondo blanco para que use el de Adobe
      style={{ height: 'calc(100vh - 60px)', width: '100%' }} 
    />
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