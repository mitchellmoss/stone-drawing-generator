"use client"

import jsPDF from 'jspdf';

// Constants for PDF generation
const PDF_MARGINS = { left: 14, top: 20 };
const PDF_CONFIG = {
  orientation: 'landscape',
  unit: 'mm',
  format: 'a4'
};
const IMAGE_SIZE = { width: 180, height: 120 };
const MAX_TEXT_WIDTH = 180;

/**
 * Detects if the current device is a mobile device
 */
export function isMobileDevice(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Creates a PDF document with stone mockup
 * Uses Web Worker when available for better performance
 */
export async function exportToPDF(canvas: HTMLCanvasElement, specs: any, notes?: string, isMobile: boolean = false) {
  return new Promise<void>((resolve, reject) => {
    try {
      // Offload image processing to a separate task
      setTimeout(async () => {
        try {
          // Get image data from canvas (this is CPU intensive)
          const imgData = canvas.toDataURL('image/png', 0.95); // Added compression quality

          // Create PDF in main thread (could be moved to worker in future)
          const pdf = createSinglePiecePDF(imgData, specs, notes);

          // Handle download based on platform
          await handlePDFDownload(pdf, specs, isMobile);
          resolve();
        } catch (error) {
          console.error('Error generating PDF:', error);
          reject(error);
        }
      }, 10);
    } catch (error) {
      console.error('Error setting up PDF export:', error);
      reject(error);
    }
  });
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
  return new Promise<void>((resolve, reject) => {
    try {
      // Generate filename
      const displayWidth = specs.displayWidth || specs.width;
      const displayHeight = specs.displayHeight || specs.height;
      const filename = `stone-mockup-${displayWidth}x${displayHeight}.pdf`;

      // Handle mobile devices differently
      if (isMobile) {
        // For mobile devices, use data URL and open in new tab
        const pdfOutput = pdf.output('datauristring');

        // Create an invisible iframe to handle the download
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        try {
          // Write PDF content to iframe
          iframe.src = pdfOutput;

          // For iOS devices, we need a different approach
          if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            // Open in new window/tab
            window.open(pdfOutput, '_blank');
          }

          // Clean up after a delay
          setTimeout(() => {
            document.body.removeChild(iframe);
            resolve();
          }, 1500); // Increased from 1000ms to 1500ms for better reliability
        } catch (error) {
          console.error('Error handling mobile PDF:', error);
          // Fallback to opening in new tab
          window.open(pdfOutput, '_blank');
          resolve();
        }
      } else {
        // For desktop, use the standard save method
        pdf.save(filename);
        resolve();
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      reject(error);
    }
  });
}

/**
 * Exports multiple stone pieces to a single PDF
 * Uses batched processing to avoid UI freezes
 */
export async function exportMultipleToPDF(
  canvases: HTMLCanvasElement[],
  specsArray: any[],
  projectName: string,
  isMobile: boolean = false
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      // Validate inputs to prevent errors
      if (!canvases || !Array.isArray(canvases) || canvases.length === 0) {
        throw new Error('No canvases provided for PDF export');
      }

      if (!specsArray || !Array.isArray(specsArray) || specsArray.length === 0) {
        throw new Error('No specifications provided for PDF export');
      }

      // Use default name if none provided
      const finalProjectName = projectName || 'Stone Project';

      // Process canvas data in batches to avoid UI freeze
      processCanvasesInBatches(canvases, specsArray, finalProjectName, isMobile)
        .then(resolve)
        .catch(reject);
    } catch (error) {
      console.error('Error in exportMultipleToPDF:', error);
      reject(error);
    }
  });
}

/**
 * Processes canvases in batches to avoid UI freezes
 */
async function processCanvasesInBatches(
  canvases: HTMLCanvasElement[],
  specsArray: any[],
  projectName: string,
  isMobile: boolean
): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      // First create the PDF document
      const pdf = new jsPDF(PDF_CONFIG);

      // Add project information
      addProjectInfoToPDF(pdf, projectName, specsArray.length);

      // Process each piece in batches
      const batchSize = 2; // Process 2 pieces at a time
      const totalPieces = Math.min(canvases.length, specsArray.length);
      let currentIndex = 0;

      const processBatch = () => {
        if (currentIndex >= totalPieces) {
          // All pieces processed, finish up
          finalizePDF(pdf, projectName, isMobile)
            .then(resolve)
            .catch(reject);
          return;
        }

        // Process a batch of pieces
        const endIndex = Math.min(currentIndex + batchSize, totalPieces);
        const processingPromises = [];

        for (let i = currentIndex; i < endIndex; i++) {
          if (i > 0) {
            pdf.addPage();
          }
          processingPromises.push(addPieceToPDF(pdf, canvases[i], specsArray[i], i, i === 0));
        }

        // After batch is processed, move to next batch
        Promise.all(processingPromises)
          .then(() => {
            currentIndex = endIndex;
            // Use setTimeout to avoid UI freezing and allow rendering between batches
            setTimeout(processBatch, 10);
          })
          .catch(error => {
            console.error('Error processing batch:', error);
            // Continue with next batch despite errors
            currentIndex = endIndex;
            setTimeout(processBatch, 10);
          });
      };

      // Start processing
      processBatch();
    } catch (error) {
      console.error('Error in processCanvasesInBatches:', error);
      reject(error);
    }
  });
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
 * Adds a single piece to the PDF
 */
async function addPieceToPDF(
  pdf: jsPDF,
  canvas: HTMLCanvasElement | null,
  item: any,
  index: number,
  isFirstPage: boolean
): Promise<void> {
  return new Promise<void>((resolve) => {
    try {
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
      if (canvas) {
        try {
          // Compress the image slightly to improve performance
          const imgData = canvas.toDataURL('image/png', 0.95);
          pdf.addImage(imgData, 'PNG', PDF_MARGINS.left, imgYPosition, IMAGE_SIZE.width, IMAGE_SIZE.height);
        } catch (error) {
          console.error(`Error adding image for piece ${index + 1}:`, error);
          // Add error message in the PDF instead of failing completely
          pdf.setTextColor(255, 0, 0);
          pdf.text('Error: Could not render preview image', PDF_MARGINS.left, imgYPosition + 60);
          pdf.setTextColor(0, 0, 0);
        }
      } else {
        // Handle missing canvas
        pdf.setTextColor(255, 0, 0);
        pdf.text('Error: Preview image not available', PDF_MARGINS.left, imgYPosition + 60);
        pdf.setTextColor(0, 0, 0);
      }

      // Signal completion
      resolve();
    } catch (error) {
      console.error(`Error adding piece ${index + 1} to PDF:`, error);
      // Don't reject to keep processing other pieces
      resolve();
    }
  });
}

/**
 * Finalizes the PDF and handles downloading
 */
async function finalizePDF(pdf: jsPDF, projectName: string, isMobile: boolean): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    try {
      // Generate filename
      const safeProjectName = projectName.replace(/\s+/g, '-').toLowerCase();
      const filename = `${safeProjectName}-stone-project.pdf`;

      // Handle mobile devices differently
      if (isMobile) {
        // For mobile devices, use data URL and open in new tab
        const pdfOutput = pdf.output('datauristring');

        // Create an invisible iframe to handle the download
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        document.body.appendChild(iframe);

        try {
          // Write PDF content to iframe
          iframe.src = pdfOutput;

          // For iOS devices, we need a different approach
          if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            // Open in new window/tab
            window.open(pdfOutput, '_blank');
          }

          // Clean up after a delay
          setTimeout(() => {
            document.body.removeChild(iframe);
            resolve();
          }, 1500); // Increased timeout for reliability
        } catch (error) {
          console.error('Error handling mobile PDF:', error);
          // Fallback to opening in new tab
          window.open(pdfOutput, '_blank');
          resolve();
        }
      } else {
        // For desktop, use the standard save method
        pdf.save(filename);
        resolve();
      }
    } catch (error) {
      console.error('Error finalizing PDF:', error);
      reject(error);
    }
  });
}
