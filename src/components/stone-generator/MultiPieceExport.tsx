"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { DimensionsInput } from './DimensionsInput'
import { MaterialPropertiesInput } from './MaterialPropertiesInput'
import { QuantityInput } from './QuantityInput'
import { NotesInput } from './NotesInput'
import { StoneSpecifications, MockupOptions, StonePiece } from '@/types/stone'
import { drawStoneMockup } from '@/lib/drawing-utils'
import { exportToPDF, exportMultipleToPDF } from '@/lib/export-utils'
import { useLocalStorage } from '@/hooks/useLocalStorage'

export interface MultiPieceExportProps {
  savedPieces: StonePiece[]
}

// Toast component for notifications - redesigned to be less intrusive
const Toast = ({ message, type = 'success', onClose }: { message: string, type?: 'success' | 'error' | 'warning', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000); // Reduced from 3000ms to 2000ms for less intrusion
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  // Color scheme based on type
  const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : 
                  type === 'error' ? 'bg-red-100 border-red-400 text-red-800' : 
                  'bg-amber-100 border-amber-400 text-amber-800';
  
  // Positioned at top-right with smaller size and subtle styling
  return (
    <div className={`fixed top-2 right-2 ${bgColor} border px-3 py-1 rounded-md shadow-sm z-50 animate-fade-in text-sm max-w-xs opacity-90`}>
      {message}
    </div>
  );
};

export function MultiPieceExport({ savedPieces }: MultiPieceExportProps) {
  const [projectName, setProjectName] = useLocalStorage<string>('stone-mockup-generator:projectName', 'Stone Project')
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0);
  const canvasRefs = useRef<(HTMLCanvasElement | null)[]>([])
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Initialize canvas refs array - improved to handle piece reordering better
  useEffect(() => {
    // Create a new array with the correct length
    const newCanvasRefs: (HTMLCanvasElement | null)[] = [];
    for (let i = 0; i < savedPieces.length; i++) {
      // Try to preserve existing canvas refs by ID if possible
      const pieceId = savedPieces[i].id;
      const existingIndex = canvasRefs.current.findIndex((_, idx) => {
        return idx < savedPieces.length && savedPieces[idx]?.id === pieceId;
      });

      if (existingIndex >= 0) {
        newCanvasRefs.push(canvasRefs.current[existingIndex]);
      } else {
        newCanvasRefs.push(null);
      }
    }

    canvasRefs.current = newCanvasRefs;
  }, [savedPieces]);  // Depend on the full array to detect reordering

  // Pre-render all canvases when pieces change
  useEffect(() => {
    savedPieces.forEach((piece, index) => {
      const canvas = canvasRefs.current[index];
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Actually draw the mockup on each canvas
      drawStoneMockup(ctx, piece.specs, {
        showGrid: true,
        showPolishedEdges: true,
        useXMarks: true,
        scale: 1
      });
    });
  }, [savedPieces]);

  // Detect mobile device
  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Pre-render a single canvas
  const renderCanvas = useCallback((piece: StonePiece, canvas: HTMLCanvasElement) => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;

    try {
      // Draw the mockup with default options
      drawStoneMockup(ctx, piece.specs, {
        showGrid: true,
        showPolishedEdges: true,
        useXMarks: true,
        scale: 1
      });
      return true;
    } catch (error) {
      console.error('Error rendering canvas:', error);
      return false;
    }
  }, []);

  // Handle export to PDF
  const handleExportPDF = async () => {
    if (savedPieces.length === 0) {
      setToast({
        message: 'Please save at least one piece before exporting',
        type: 'warning'
      });
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Render the canvases - with progress tracking
      let renderedCount = 0;

      for (let i = 0; i < savedPieces.length; i++) {
        const canvas = canvasRefs.current[i];
        if (canvas) {
          renderCanvas(savedPieces[i], canvas);
        }
        renderedCount++;
        setExportProgress(Math.floor((renderedCount / savedPieces.length) * 50)); // First 50% is rendering
      }

      // Filter out any null canvases
      const validCanvases = canvasRefs.current.filter(
        (canvas): canvas is HTMLCanvasElement => canvas !== null
      );

      try {
        // Check if running on mobile
        const isMobile = isMobileDevice();

        // Set progress to show we're starting PDF generation
        setExportProgress(50);

        // Export all pieces to a single PDF with the improved function
        await exportMultipleToPDF(
          validCanvases,
          savedPieces,
          projectName,
          isMobile
        );

        setExportProgress(100);
        setToast({
          message: 'PDF exported successfully',
          type: 'success'
        });
      } catch (error) {
        console.error('Error exporting to PDF:', error);

        setToast({
          message: 'Error exporting to PDF: ' + (error instanceof Error ? error.message : 'Unknown error'),
          type: 'error'
        });
      } finally {
        setIsExporting(false);
        // Reset progress after a brief delay to show 100%
        setTimeout(() => setExportProgress(0), 1000);
      }
    } catch (error) {
      console.error('Error preparing for PDF export:', error);

      setToast({
        message: 'Failed to prepare for PDF export. Please try again.',
        type: 'error'
      });
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  if (savedPieces.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg mt-6 border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Multi-Piece Export</h2>
        <p className="text-gray-600">Save some pieces to enable multi-piece export.</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg mt-6 border border-gray-100">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Multi-Piece Export</h2>
      
      <div className="mb-4">
        <label htmlFor="project-name" className="block text-sm font-medium text-gray-700 mb-1">
          Project Name
        </label>
        <input
          type="text"
          id="project-name"
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-800"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
        />
      </div>
      
      <div className="mb-4">
        <h3 className="text-md font-medium mb-2 text-gray-700">Pieces to Export ({savedPieces.length})</h3>
        <div className="max-h-40 overflow-y-auto border rounded-md p-2 shadow-inner">
          {savedPieces.map((piece, index) => (
            <div key={piece.id} className="mb-2 last:mb-0 p-2 hover:bg-gray-50 transition-colors rounded">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Piece {index + 1}:</span> {piece.specs.width}" × {piece.specs.height}", 
                {piece.specs.materialType}, {piece.specs.thickness}
              </p>
              {piece.notes && (
                <p className="text-sm text-gray-600 ml-4 mt-1 bg-gray-50 p-1 rounded border border-gray-100">
                  <span className="font-medium">Notes:</span> {piece.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <button
          className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-md hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none disabled:shadow-none"
          onClick={handleExportPDF}
          disabled={isExporting || savedPieces.length === 0}
        >
          {isExporting ? `Generating PDF... ${exportProgress}%` : 'Export All Pieces to PDF'}
        </button>

        {/* Progress bar */}
        {isExporting && (
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${exportProgress}%` }}
            ></div>
          </div>
        )}
      </div>
      
      {/* Hidden canvases for rendering each piece */}
      <div className="hidden">
        {savedPieces.map((piece, index) => (
          <canvas
            key={piece.id}
            ref={(el) => (canvasRefs.current[index] = el)}
            width={800}
            height={600}
          />
        ))}
      </div>
      
      {/* Toast notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  )
}
