// src/lib/pdfConfig.js
import { pdfjs } from 'react-pdf';

// Configurar worker solo una vez
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
}

export { pdfjs };