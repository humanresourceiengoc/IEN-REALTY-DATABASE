import * as pdfjsLib from 'pdfjs-dist';

// Set worker source using a reliable CDN matching version or bundled worker
if (typeof window !== 'undefined') {
  try {
    // Set worker URL to unpkg/cdnjs or worker bundle
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version || '4.10.38'}/build/pdf.worker.min.mjs`;
  } catch (err) {
    console.warn('Failed to set PDF.js workerSrc:', err);
  }
}

export interface RenderedPdfPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Converts a Base64 data URI or ArrayBuffer or Uint8Array into an array of high-res image data URLs (one per page).
 */
export async function renderPdfToPageImages(
  pdfData: string | Uint8Array | ArrayBuffer,
  scale: number = 2.0
): Promise<RenderedPdfPage[]> {
  try {
    let loadingTask;

    if (typeof pdfData === 'string') {
      if (pdfData.startsWith('data:')) {
        // Base64 data URL
        const base64Data = pdfData.split(',')[1];
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        loadingTask = pdfjsLib.getDocument({ data: bytes });
      } else if (pdfData.startsWith('http://') || pdfData.startsWith('https://') || pdfData.startsWith('/')) {
        loadingTask = pdfjsLib.getDocument({ url: pdfData });
      } else {
        // Plain base64 string
        const binaryStr = atob(pdfData);
        const bytes = new Uint8Array(binaryStr.length);
        for (let i = 0; i < binaryStr.length; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        loadingTask = pdfjsLib.getDocument({ data: bytes });
      }
    } else {
      loadingTask = pdfjsLib.getDocument({ data: pdfData });
    }

    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const pages: RenderedPdfPage[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Fill white background before rendering
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, canvas.width, canvas.height);

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
      };

      await page.render(renderContext).promise;
      const dataUrl = canvas.toDataURL('image/png', 0.92);

      pages.push({
        pageNumber: pageNum,
        dataUrl,
        width: viewport.width,
        height: viewport.height,
      });
    }

    return pages;
  } catch (error) {
    console.error('Error rendering PDF with PDF.js:', error);
    throw error;
  }
}
