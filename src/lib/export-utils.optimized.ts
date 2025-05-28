"use client"

import jsPDF from 'jspdf';

// Constants for PDF generation
const PDF_MARGINS = { left: 14, top: 20 };
const PDF_CONFIG = {
  orientation: 'landscape' as const,
  unit: 'mm' as const,
  format: 'a4' as const
};
const IMAGE_SIZE = { width: 180, height: 120 };
const MAX_TEXT_WIDTH = 180;

// Web Worker for image processing (if available)
let imageWorker: Worker | null = null;

/**
 * Initialize image processing worker
 */
function initImageWorker() {
  if (typeof Worker !== 'undefined' && !imageWorker) {
    try {
      const workerCode = `
        self.onmessage = function(e) {
          const { imageData, width, height, quality } = e.data;
          
          // Process image data
          const canvas = new OffscreenCanvas(width, height);
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            ctx.putImageData(imageData, 0, 0);
            
            canvas.convertToBlob({ type: 'image/png', quality })
              .then(blob => blob.arrayBuffer())
              .then(buffer => {
                self.postMessage({ success: true, buffer }, [buffer]);
              })
              .catch(error => {
                self.postMessage({ success: false, error: error.message });
              });
          } else {
            self.postMessage({ success: false, error: 'Failed to get context' });
          }
        };
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      imageWorker = new Worker(workerUrl);
      
      // Clean up URL after worker is created
      URL.revokeObjectURL(workerUrl);
    } catch (error) {
      console.warn('Failed to create image worker:', error);
      imageWorker = null;
    }
  }
}

/**
 * Detects if the current device is a mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Optimized canvas to data URL conversion
 */
async function canvasToDataURL(canvas: HTMLCanvasElement, quality: number = 0.95): Promise<string> {
  return new Promise((resolve, reject) => {
    // Try to use OffscreenCanvas for better performance
    if (typeof OffscreenCanvas !== 'undefined' && canvas.transferToImageBitmap) {
      try {
        const bitmap = canvas.transferToImageBitmap();
        const offscreen = new OffscreenCanvas(canvas.width, canvas.height);
        const ctx = offscreen.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(bitmap, 0, 0);
          
          offscreen.convertToBlob({ type: 'image/png', quality })
            .then(blob => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            })
            .catch(reject);
          
          return;
        }
      } catch (error) {
        // Fall back to standard method
      }
    }
    
    // Standard method
    try {
      const dataUrl = canvas.toDataURL('image/png', quality);
      resolve(dataUrl);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Creates a PDF document with stone mockup
 * Optimized for better performance
 */
export async function exportToPDF(
  canvas: HTMLCanvasElement, 
  specs: any, 
  notes?: string, 
  isMobile: boolean = false
): Promise<void> {
  // Initialize worker if needed
  initImageWorker();
  
  try {
    // Get image data asynchronously
    const imgData = await canvasToDataURL(canvas, 0.85); // Reduced quality for faster processing
    
    // Create PDF document
    const pdf = createSinglePiecePDF(imgData, specs, notes);
    
    // Handle download
    await handlePDFDownload(pdf, specs, isMobile);
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
}

/**
 * Creates a PDF document for a single stone piece
 */
function createSinglePiecePDF(imgData: string, specs: any, notes?: string): jsPDF {
  // Create a new PDF document
  const pdf = new jsPDF(PDF_CONFIG);

  // Use displayWidth/displayHeight if available (for fraction display), otherwise use width/height
  const displayWidth = specs.displayWidth || specs.width;
  const displayHeight = specs.displayHeight || specs.height;

  // Add title
  pdf.setFontSize(18);
  pdf.text(`Stone Mockup: ${displayWidth}" × ${displayHeight}"`, PDF_MARGINS.left, PDF_MARGINS.top);

  // Add specifications
  pdf.setFontSize(12);
  pdf.text(`Material: ${specs.materialType}`, PDF_MARGINS.left, PDF_MARGINS.top + 10);
  pdf.text(`Thickness: ${specs.thickness}`, PDF_MARGINS.left, PDF_MARGINS.top + 17);
  pdf.text(`Quantity: ${specs.quantity || 1}`, PDF_MARGINS.left, PDF_MARGINS.top + 24);

  // Add polished edges information - with safety check for undefined
  const polishedEdgesText = specs.polishedEdges && Array.isArray(specs.polishedEdges)
    ? `Polished Edges: ${specs.polishedEdges.join(', ')}`
    : 'Polished Edges: None';
  pdf.text(polishedEdgesText, PDF_MARGINS.left, PDF_MARGINS.top + 31);

  // Add notes if provided
  let yPosition = PDF_MARGINS.top + 45;
  if (notes && notes.trim() !== '') {
    pdf.text('Notes:', PDF_MARGINS.left, PDF_MARGINS.top + 38);

    // Split notes into lines to avoid text overflow
    const textLines = pdf.splitTextToSize(notes, MAX_TEXT_WIDTH);
    pdf.text(textLines, PDF_MARGINS.left, PDF_MARGINS.top + 45);

    // Adjust position based on text height (approximate)
    yPosition += Math.min(textLines.length * 5, 60); // Cap maximum shift to avoid image going off-page
  }

  // Add the mockup image
  pdf.addImage(imgData, 'PNG', PDF_MARGINS.left, yPosition, IMAGE_SIZE.width, IMAGE_SIZE.height);

  return pdf;
}

/**
 * Handles PDF download based on platform
 */
async function handlePDFDownload(pdf: jsPDF, specs: any, isMobile: boolean): Promise<void> {
  // Generate filename
  const displayWidth = specs.displayWidth || specs.width;
  const displayHeight = specs.displayHeight || specs.height;
  const filename = `stone-mockup-${displayWidth}x${displayHeight}.pdf`;

  // Handle mobile devices differently
  if (isMobile) {
    // For mobile devices, use blob and object URL for better performance
    const pdfBlob = pdf.output('blob');
    const url = URL.createObjectURL(pdfBlob);
    
    try {
      // Try to open in new tab
      const newWindow = window.open(url, '_blank');
      
      if (!newWindow) {
        // If popup blocked, create download link
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      
      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error('Error handling mobile PDF:', error);
      // Fallback to data URL
      const pdfOutput = pdf.output('datauristring');
      window.open(pdfOutput, '_blank');
    }
  } else {
    // For desktop, use the standard save method
    pdf.save(filename);
  }
}

/**
 * Exports multiple stone pieces to a single PDF
 * Optimized with true async processing
 */
export async function exportMultipleToPDF(
  canvases: HTMLCanvasElement[],
  specsArray: any[],
  projectName: string,
  isMobile: boolean = false
): Promise<void> {
  // Validate inputs
  if (!canvases || !Array.isArray(canvases) || canvases.length === 0) {
    throw new Error('No canvases provided for PDF export');
  }

  if (!specsArray || !Array.isArray(specsArray) || specsArray.length === 0) {
    throw new Error('No specifications provided for PDF export');
  }

  // Use default name if none provided
  const finalProjectName = projectName || 'Stone Project';

  // Initialize worker if needed
  initImageWorker();

  // Create PDF document
  const pdf = new jsPDF(PDF_CONFIG);

  // Add project information
  addProjectInfoToPDF(pdf, finalProjectName, specsArray.length);

  // Process pieces with progress tracking
  const totalPieces = Math.min(canvases.length, specsArray.length);
  
  for (let i = 0; i < totalPieces; i++) {
    if (i > 0) {
      pdf.addPage();
    }
    
    try {
      // Process canvas to image data
      const imgData = await canvasToDataURL(canvases[i], 0.85);
      
      // Add piece to PDF
      await addPieceToPDFOptimized(pdf, imgData, specsArray[i], i, i === 0);
      
      // Yield to browser to prevent UI freeze
      await new Promise(resolve => setTimeout(resolve, 0));
    } catch (error) {
      console.error(`Error processing piece ${i + 1}:`, error);
      // Continue with next piece
    }
  }

  // Finalize and download
  await finalizePDF(pdf, finalProjectName, isMobile);
}

/**
 * Adds project information to the PDF
 */
function addProjectInfoToPDF(pdf: jsPDF, projectName: string, totalPieces: number): void {
  // Add project title
  pdf.setFontSize(20);
  pdf.text(`Stone Project: ${projectName}`, PDF_MARGINS.left, PDF_MARGINS.top);

  // Add date
  pdf.setFontSize(12);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, PDF_MARGINS.left, PDF_MARGINS.top + 10);

  // Add total pieces count
  pdf.text(`Total Pieces: ${totalPieces}`, PDF_MARGINS.left, PDF_MARGINS.top + 17);
}

/**
 * Optimized version of addPieceToPDF
 */
async function addPieceToPDFOptimized(
  pdf: jsPDF,
  imgData: string,
  item: any,
  index: number,
  isFirstPage: boolean
): Promise<void> {
  // Handle both direct specs objects and {id, specs} format
  const specs = item.specs || item;

  // Use displayWidth/displayHeight if available (for fraction display), otherwise use width/height
  const displayWidth = specs.displayWidth || specs.width;
  const displayHeight = specs.displayHeight || specs.height;

  // Add piece title - offset for first page which already has the project info
  const titleY = isFirstPage ? PDF_MARGINS.top + 35 : PDF_MARGINS.top;
  pdf.setFontSize(16);
  pdf.text(`Piece ${index + 1}: ${displayWidth}" × ${displayHeight}"`, PDF_MARGINS.left, titleY);

  // Add specifications - offset for first page
  const yStart = isFirstPage ? titleY + 10 : PDF_MARGINS.top + 10;
  pdf.setFontSize(12);
  pdf.text(`Material: ${specs.materialType}`, PDF_MARGINS.left, yStart);
  pdf.text(`Thickness: ${specs.thickness}`, PDF_MARGINS.left, yStart + 7);
  pdf.text(`Quantity: ${specs.quantity || 1}`, PDF_MARGINS.left, yStart + 14);

  // Add polished edges information - with safety check for undefined
  const polishedEdgesText = specs.polishedEdges && Array.isArray(specs.polishedEdges)
    ? `Polished Edges: ${specs.polishedEdges.join(', ')}`
    : 'Polished Edges: None';
  pdf.text(polishedEdgesText, PDF_MARGINS.left, yStart + 21);

  // Add notes if available
  let imgYPosition = yStart + 35;
  const itemNotes = item.notes || specs.notes;
  if (itemNotes && itemNotes.trim() !== '') {
    pdf.text('Notes:', PDF_MARGINS.left, yStart + 28);

    // Split notes into lines to avoid text overflow
    const textLines = pdf.splitTextToSize(itemNotes, MAX_TEXT_WIDTH);
    pdf.text(textLines, PDF_MARGINS.left, yStart + 35);

    // Adjust image position based on notes length (with maximum to avoid going off page)
    const notesHeight = Math.min(textLines.length * 5, 60);
    imgYPosition = yStart + 35 + notesHeight;
  }

  // Add the mockup image
  try {
    pdf.addImage(imgData, 'PNG', PDF_MARGINS.left, imgYPosition, IMAGE_SIZE.width, IMAGE_SIZE.height);
  } catch (error) {
    console.error(`Error adding image for piece ${index + 1}:`, error);
    // Add error message in the PDF instead of failing completely
    pdf.setTextColor(255, 0, 0);
    pdf.text('Error: Could not render preview image', PDF_MARGINS.left, imgYPosition + 60);
    pdf.setTextColor(0, 0, 0);
  }
}

/**
 * Finalizes the PDF and handles downloading
 */
async function finalizePDF(pdf: jsPDF, projectName: string, isMobile: boolean): Promise<void> {
  // Generate filename
  const safeProjectName = projectName.replace(/\s+/g, '-').toLowerCase();
  const filename = `${safeProjectName}-stone-project.pdf`;

  // Handle download
  await handlePDFDownload({ ...pdf, output: pdf.output.bind(pdf), save: pdf.save.bind(pdf) } as any, { displayWidth: 'multi', displayHeight: 'piece' }, isMobile);
}

// Clean up worker on module unload
if (typeof window !== 'undefined') {
  window.addEventListener('unload', () => {
    if (imageWorker) {
      imageWorker.terminate();
      imageWorker = null;
    }
  });
}