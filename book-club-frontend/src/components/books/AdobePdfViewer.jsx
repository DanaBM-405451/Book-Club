'use client';

import { useEffect, useRef } from 'react';

export default function AdobePdfViewer({ url, title, initialPage = 1, onPageChange }) {
  const viewerRef = useRef(null);

  useEffect(() => {
    const initViewer = () => {
      if (!window.AdobeDC || !viewerRef.current) return;

      try {
        const adobeDCView = new window.AdobeDC.View({
          // ⚠️ TU CLIENT ID AQUI
          clientId: "40ad5c2c058b4b4eb9069f1a6cbc864b", 
          divId: "adobe-pdf-container",
        });

        // 1. Renderizar el archivo
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

        // 2. Configurar eventos una vez que cargue
        previewPromise.then((adobeViewer) => {
          // Ir a la página guardada inicialmente
          adobeViewer.getAPIs().then((apis) => {
            if (initialPage > 1) {
              apis.gotoLocation(parseInt(initialPage));
            }
          });

          // Escuchar el cambio de página (PAGE_VIEW)
          const eventOptions = {
            listenOn: [window.AdobeDC.View.Enum.Events.PAGE_VIEW]
          };

          adobeDCView.registerCallback(
            window.AdobeDC.View.Enum.CallbackType.EVENT_LISTENER,
            (event) => {
              if (event.type === 'PAGE_VIEW' && onPageChange) {
                // event.data.pageNumber es el número de página actual
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
  }, [url, title]); // Quitamos initialPage y onPageChange para evitar recargas innecesarias

  return (
    <div 
      id="adobe-pdf-container" 
      ref={viewerRef} 
      className="w-full h-full bg-white"
      style={{ height: 'calc(100vh - 60px)', width: '100%' }} 
    />
  );
}