"use client"

import jsPDF from 'jspdf';

export async function exportToPDF(canvas: HTMLCanvasElement, specs: any, notes?: string, isMobile: boolean = false) {
  // Create a new PDF document
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // Use displayWidth/displayHeight if available (for fraction display), otherwise use width/height
  const displayWidth = specs.displayWidth || specs.width;
  const displayHeight = specs.displayHeight || specs.height;
  
  // Add title
  pdf.setFontSize(18);
  pdf.text(`Stone Mockup: ${displayWidth}" × ${displayHeight}"`, 14, 20);
  
  // Add specifications
  pdf.setFontSize(12);
  pdf.text(`Material: ${specs.materialType}`, 14, 30);
  pdf.text(`Thickness: ${specs.thickness}`, 14, 37);
  pdf.text(`Quantity: ${specs.quantity || 1}`, 14, 44);
  
  // Add polished edges information - with safety check for undefined
  const polishedEdgesText = specs.polishedEdges && Array.isArray(specs.polishedEdges) 
    ? `Polished Edges: ${specs.polishedEdges.join(', ')}` 
    : 'Polished Edges: None';
  pdf.text(polishedEdgesText, 14, 51);
  
  // Add notes if provided
  if (notes && notes.trim() !== '') {
    pdf.text('Notes:', 14, 58);
    
    // Split notes into lines to avoid text overflow
    const textLines = pdf.splitTextToSize(notes, 180);
    pdf.text(textLines, 14, 65);
  }
  
  // Add the mockup image
  const imgData = canvas.toDataURL('image/png');
  
  // Calculate position to center the image
  // Adjust the y-position based on whether notes are present
  const yPosition = notes && notes.trim() !== '' ? 85 : 65;
  
  pdf.addImage(imgData, 'PNG', 14, yPosition, 180, 120);
  
  // Generate filename
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
      }, 1000);
    } catch (error) {
      console.error('Error handling mobile PDF:', error);
      // Fallback to opening in new tab
      window.open(pdfOutput, '_blank');
    }
  } else {
    // For desktop, use the standard save method
    pdf.save(filename);
  }
}

export async function exportMultipleToPDF(
  canvases: HTMLCanvasElement[],
  specsArray: any[],
  projectName: string,
  isMobile: boolean = false
) {
  // Validate inputs to prevent errors
  if (!canvases || !Array.isArray(canvases) || canvases.length === 0) {
    throw new Error('No canvases provided for PDF export');
  }
  
  if (!specsArray || !Array.isArray(specsArray) || specsArray.length === 0) {
    throw new Error('No specifications provided for PDF export');
  }
  
  if (!projectName) {
    projectName = 'Stone Project';
  }
  
  // Create a new PDF document
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });
  
  // Add project title
  pdf.setFontSize(20);
  pdf.text(`Stone Project: ${projectName}`, 14, 20);
  
  // Add date
  pdf.setFontSize(12);
  pdf.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
  
  // Add total pieces count
  pdf.text(`Total Pieces: ${specsArray.length}`, 14, 37);
  
  // Add a new page for each piece
  specsArray.forEach((item, index) => {
    // Handle both direct specs objects and {id, specs} format
    const specs = item.specs || item;
    
    if (index > 0) {
      pdf.addPage();
    } else {
      // First page already has the project info, so add some space
      pdf.text('', 14, 45); // Empty line for spacing
    }
    
    // Use displayWidth/displayHeight if available (for fraction display), otherwise use width/height
    const displayWidth = specs.displayWidth || specs.width;
    const displayHeight = specs.displayHeight || specs.height;
    
    // Add piece title
    pdf.setFontSize(16);
    pdf.text(`Piece ${index + 1}: ${displayWidth}" × ${displayHeight}"`, 14, index === 0 ? 55 : 20);
    
    // Add specifications
    pdf.setFontSize(12);
    const yStart = index === 0 ? 65 : 30;
    pdf.text(`Material: ${specs.materialType}`, 14, yStart);
    pdf.text(`Thickness: ${specs.thickness}`, 14, yStart + 7);
    pdf.text(`Quantity: ${specs.quantity || 1}`, 14, yStart + 14);
    
    // Add polished edges information - with safety check for undefined
    const polishedEdgesText = specs.polishedEdges && Array.isArray(specs.polishedEdges) 
      ? `Polished Edges: ${specs.polishedEdges.join(', ')}` 
      : 'Polished Edges: None';
    pdf.text(polishedEdgesText, 14, yStart + 21);
    
    // Add notes if available
    let imgYPosition = yStart + 35;
    const itemNotes = item.notes || specs.notes;
    if (itemNotes && itemNotes.trim() !== '') {
      pdf.text('Notes:', 14, yStart + 28);
      
      // Split notes into lines to avoid text overflow
      const textLines = pdf.splitTextToSize(itemNotes, 180);
      pdf.text(textLines, 14, yStart + 35);
      
      // Adjust image position based on notes length
      imgYPosition = yStart + 35 + (textLines.length * 5);
    }
    
    // Add the mockup image
    const canvas = canvases[index];
    if (canvas) {
      try {
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', 14, imgYPosition, 180, 120);
      } catch (error) {
        console.error(`Error adding image for piece ${index + 1}:`, error);
        // Add error message in the PDF instead of failing completely
        pdf.setTextColor(255, 0, 0);
        pdf.text('Error: Could not render preview image', 14, imgYPosition + 60);
        pdf.setTextColor(0, 0, 0);
      }
    } else {
      // Handle missing canvas
      pdf.setTextColor(255, 0, 0);
      pdf.text('Error: Preview image not available', 14, imgYPosition + 60);
      pdf.setTextColor(0, 0, 0);
    }
  });
  
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
      }, 1000);
    } catch (error) {
      console.error('Error handling mobile PDF:', error);
      // Fallback to opening in new tab
      window.open(pdfOutput, '_blank');
    }
  } else {
    // For desktop, use the standard save method
    pdf.save(filename);
  }
}
