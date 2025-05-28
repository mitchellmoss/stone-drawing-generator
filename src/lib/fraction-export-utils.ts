"use client"

import {
  exportToPDF as originalExportToPDF,
  exportMultipleToPDF as originalExportMultipleToPDF,
} from '@/lib/export-utils';
import { StoneSpecifications } from '@/types/stone';
import { decimalToFraction } from '@/lib/fraction-utils';

/**
 * Modified export to PDF function that uses fraction display
 */
export function exportToPDF(
  canvas: HTMLCanvasElement,
  specs: StoneSpecifications,
  notes?: string
): Promise<void> {
  // Convert decimal dimensions to fraction strings for the PDF title
  const widthFraction = decimalToFraction(specs.width);
  const heightFraction = decimalToFraction(specs.height);
  
  // Create a modified specs object with fraction strings for display
  const displaySpecs = {
    ...specs,
    displayWidth: widthFraction,
    displayHeight: heightFraction
  };
  
  // Call the original export function with the modified specs
  return originalExportToPDF(canvas, displaySpecs, notes);
}

/**
 * Export multiple pieces to a single PDF
 */
export function exportMultipleToPDF(
  canvases: HTMLCanvasElement[],
  pieces: Array<{
    id: string;
    specs: StoneSpecifications;
    notes?: string;
  }>,
  projectName: string,
  isMobile: boolean = false
): Promise<void> {
  // Convert decimal dimensions to fraction strings for each piece
  const piecesWithFractions = pieces.map(piece => ({
    ...piece,
    specs: {
      ...piece.specs,
      displayWidth: decimalToFraction(piece.specs.width),
      displayHeight: decimalToFraction(piece.specs.height)
    }
  }));
  
  // Use the original export function with the modified pieces
  return originalExportMultipleToPDF(
    canvases,
    piecesWithFractions,
    projectName,
    isMobile,
  );
}
