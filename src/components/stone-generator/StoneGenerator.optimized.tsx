"use client"

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { DimensionsInput } from './DimensionsInput'
import { MaterialPropertiesInput } from './MaterialPropertiesInput'
import { QuantityInput } from './QuantityInput'
import { NotesInput } from './NotesInput'
import { StoneSpecifications, MockupOptions, StonePiece } from '@/types/stone'
import { drawStoneMockup } from '@/lib/drawing-utils.optimized'
import { exportToPDF } from '@/lib/export-utils.optimized'
import { useLocalStorage } from '@/hooks/useLocalStorage'

export interface StoneGeneratorProps {
  onSavePiece: (piece: StonePiece) => void;
  onRemovePiece: (id: string) => void;
  savedPieces: StonePiece[];
}

// Toast component for notifications - redesigned to be less intrusive
const Toast = ({ message, type = 'success', onClose }: { message: string, type?: 'success' | 'error' | 'warning', onClose: () => void }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-800' : 
                  type === 'error' ? 'bg-red-100 border-red-400 text-red-800' : 
                  'bg-amber-100 border-amber-400 text-amber-800';
  
  return (
    <div className={`fixed top-2 right-2 ${bgColor} border px-3 py-1 rounded-md shadow-sm z-50 animate-fade-in text-sm max-w-xs opacity-90`}>
      {message}
    </div>
  );
};

export function StoneGenerator({ onSavePiece, onRemovePiece, savedPieces }: StoneGeneratorProps) {
  // Stone specifications state with localStorage persistence
  const [specs, setSpecs] = useLocalStorage<StoneSpecifications>('stone-mockup-generator:currentSpecs', {
    width: 24,
    height: 4,
    polishedEdges: ['top'],
    materialType: 'quartz',
    thickness: '2cm',
    quantity: 1
  });

  // Notes state with localStorage persistence
  const [notes, setNotes] = useLocalStorage<string>('stone-mockup-generator:currentNotes', '');

  // Mockup display options with localStorage persistence
  const [options, setOptions] = useLocalStorage<MockupOptions>('stone-mockup-generator:displayOptions', {
    showGrid: true,
    showPolishedEdges: true,
    useXMarks: true,
    scale: 1
  });
  
  // Loading state for PDF generation
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Canvas reference
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Track if we need to redraw
  const [needsRedraw, setNeedsRedraw] = useState(true);
  
  // Animation frame reference for cancellation
  const animationFrameRef = useRef<number>();
  
  // Offscreen canvas for double buffering
  const offscreenCanvasRef = useRef<HTMLCanvasElement>();

  // Initialize offscreen canvas
  useEffect(() => {
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
      offscreenCanvasRef.current.width = 800;
      offscreenCanvasRef.current.height = 600;
    }
  }, []);

  // Optimized redraw function using requestAnimationFrame
  const redrawCanvas = useCallback(() => {
    if (!needsRedraw) return;
    
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const offscreenCanvas = offscreenCanvasRef.current;
      if (!canvas || !offscreenCanvas) return;

      const ctx = canvas.getContext('2d', { alpha: false });
      const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: false });
      if (!ctx || !offscreenCtx) return;

      // Draw to offscreen canvas first
      drawStoneMockup(offscreenCtx, specs, options);
      
      // Copy to main canvas
      ctx.drawImage(offscreenCanvas, 0, 0);
      
      // Mark as redrawn
      setNeedsRedraw(false);
    });
  }, [specs, options, needsRedraw]);

  // Mark for redraw when specs or options change
  useEffect(() => {
    setNeedsRedraw(true);
  }, [specs, options]);

  // Perform redraw when needed
  useEffect(() => {
    if (needsRedraw) {
      redrawCanvas();
    }
  }, [needsRedraw, redrawCanvas]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);
  
  // Detect mobile device - memoized
  const isMobileDevice = useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }, []);

  // Batch state updates
  const updateSpecs = useCallback((updates: Partial<StoneSpecifications>) => {
    setSpecs(prev => ({ ...prev, ...updates }));
  }, [setSpecs]);

  // Handle dimension changes
  const handleWidthChange = useCallback((width: number) => {
    updateSpecs({ width });
  }, [updateSpecs]);

  const handleHeightChange = useCallback((height: number) => {
    updateSpecs({ height });
  }, [updateSpecs]);

  // Handle polished edges changes
  const handlePolishedEdgesChange = useCallback((polishedEdges: string[]) => {
    updateSpecs({ polishedEdges });
  }, [updateSpecs]);

  // Handle material properties changes
  const handleMaterialTypeChange = useCallback((materialType: string) => {
    updateSpecs({ materialType });
  }, [updateSpecs]);

  const handleThicknessChange = useCallback((thickness: string) => {
    updateSpecs({ thickness });
  }, [updateSpecs]);

  // Handle quantity changes
  const handleQuantityChange = useCallback((quantity: number) => {
    updateSpecs({ quantity });
  }, [updateSpecs]);

  // Handle notes changes
  const handleNotesChange = useCallback((newNotes: string) => {
    setNotes(newNotes);
  }, [setNotes]);

  // Handle display options changes
  const handleOptionChange = useCallback((option: keyof MockupOptions, value: boolean | number) => {
    setOptions(prev => ({ ...prev, [option]: value }));
  }, [setOptions]);

  // Handle save piece
  const handleSavePiece = useCallback(() => {
    const newPiece: StonePiece = {
      id: Date.now().toString(),
      specs: { ...specs },
      notes: notes
    };
    
    onSavePiece(newPiece);
    
    // Show toast notification
    setToast({
      message: `Piece saved: ${specs.width}" × ${specs.height}"`,
      type: 'success'
    });
    
    // Clear notes field after saving
    setNotes('');
  }, [specs, notes, onSavePiece, setNotes]);

  // Handle download as PNG
  const handleDownloadPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Use blob for better performance
      canvas.toBlob((blob) => {
        if (!blob) {
          throw new Error('Failed to create blob');
        }
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `stone-mockup-${specs.width}x${specs.height}.png`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        // Show success toast
        setToast({
          message: 'PNG downloaded successfully',
          type: 'success'
        });
      }, 'image/png');
    } catch (error) {
      console.error('Error generating PNG:', error);
      
      // Show error toast
      setToast({
        message: 'Failed to generate PNG. Please try again.',
        type: 'error'
      });
    }
  }, [specs]);

  // Handle download as PDF - improved for performance
  const handleDownloadPDF = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsGeneratingPDF(true);

    try {
      // Call the improved exportToPDF with proper error handling
      await exportToPDF(canvas, specs, notes, isMobileDevice);

      // Show success toast
      setToast({
        message: 'PDF exported successfully',
        type: 'success'
      });
    } catch (error) {
      console.error('Error generating PDF:', error);

      // Show error toast
      setToast({
        message: 'Error exporting to PDF: ' + (error instanceof Error ? error.message : 'Unknown error'),
        type: 'error'
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [specs, notes, isMobileDevice]);

  // Determine if the long sides are top/bottom or left/right based on dimensions
  const { longSides, shortSides } = useMemo(() => {
    if (specs.width >= specs.height) {
      return {
        longSides: ['top', 'bottom'],
        shortSides: ['left', 'right']
      };
    } else {
      return {
        longSides: ['left', 'right'],
        shortSides: ['top', 'bottom']
      };
    }
  }, [specs.width, specs.height]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Input Panel - Takes 4 columns on large screens */}
      <div className="lg:col-span-4 bg-white p-6 rounded-lg shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Stone Specifications</h2>
        <div className="space-y-6">
          <DimensionsInput 
            width={specs.width} 
            height={specs.height} 
            onWidthChange={handleWidthChange} 
            onHeightChange={handleHeightChange} 
          />
          
          <div className="space-y-4">
            <h3 className="font-medium text-gray-700">Polished Edges</h3>
            
            <div className="space-y-2">
              {longSides.map(side => (
                <div key={side} className="flex items-center">
                  <input
                    id={`${side}-edge`}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={specs.polishedEdges.includes(side)}
                    onChange={() => {
                      if (specs.polishedEdges.includes(side)) {
                        handlePolishedEdgesChange(specs.polishedEdges.filter(e => e !== side));
                      } else {
                        handlePolishedEdgesChange([...specs.polishedEdges, side]);
                      }
                    }}
                  />
                  <label htmlFor={`${side}-edge`} className="ml-2 block text-sm text-gray-700">
                    {side.charAt(0).toUpperCase() + side.slice(1)} Edge (Long Side)
                  </label>
                </div>
              ))}
              
              {shortSides.map(side => (
                <div key={side} className="flex items-center">
                  <input
                    id={`${side}-edge`}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={specs.polishedEdges.includes(side)}
                    onChange={() => {
                      if (specs.polishedEdges.includes(side)) {
                        handlePolishedEdgesChange(specs.polishedEdges.filter(e => e !== side));
                      } else {
                        handlePolishedEdgesChange([...specs.polishedEdges, side]);
                      }
                    }}
                  />
                  <label htmlFor={`${side}-edge`} className="ml-2 block text-sm text-gray-700">
                    {side.charAt(0).toUpperCase() + side.slice(1)} Edge (Short Side)
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <MaterialPropertiesInput 
            materialType={specs.materialType} 
            thickness={specs.thickness} 
            onMaterialTypeChange={handleMaterialTypeChange} 
            onThicknessChange={handleThicknessChange} 
          />
          
          <QuantityInput 
            quantity={specs.quantity} 
            onQuantityChange={handleQuantityChange} 
          />

          {/* Add Notes Input Component */}
          <NotesInput
            notes={notes}
            onNotesChange={handleNotesChange}
          />

          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="font-medium text-gray-700">Display Options</h3>
            
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  id="show-grid"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={options.showGrid}
                  onChange={(e) => handleOptionChange('showGrid', e.target.checked)}
                />
                <label htmlFor="show-grid" className="ml-2 block text-sm text-gray-700">
                  Show Grid
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="show-polished-edges"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={options.showPolishedEdges}
                  onChange={(e) => handleOptionChange('showPolishedEdges', e.target.checked)}
                />
                <label htmlFor="show-polished-edges" className="ml-2 block text-sm text-gray-700">
                  Show Polished Edges
                </label>
              </div>
              
              <div className="flex items-center">
                <input
                  id="use-x-marks"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={options.useXMarks}
                  onChange={(e) => handleOptionChange('useXMarks', e.target.checked)}
                />
                <label htmlFor="use-x-marks" className="ml-2 block text-sm text-gray-700">
                  Use X Marks
                </label>
              </div>
            </div>

            <div>
              <label htmlFor="scale" className="block text-sm font-medium text-gray-700 mb-1">
                Scale: {options.scale.toFixed(1)}x
              </label>
              <input
                type="range"
                id="scale"
                min="0.5"
                max="2"
                step="0.1"
                value={options.scale}
                onChange={(e) => handleOptionChange('scale', parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          
          <div className="pt-4">
            <button
              className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-md hover:from-green-700 hover:to-green-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              onClick={handleSavePiece}
            >
              Save This Piece
            </button>
          </div>
          
          {savedPieces.length > 0 && (
            <div className="pt-2">
              <h3 className="font-medium text-gray-700 mb-2">Saved Pieces ({savedPieces.length})</h3>
              <div className="max-h-60 overflow-y-auto border rounded-md shadow-inner">
                {savedPieces.map((piece) => (
                  <div key={piece.id} className="flex flex-col p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-medium text-gray-800">{piece.specs.width}" × {piece.specs.height}"</span>
                        <span className="text-sm text-gray-500 block">
                          {piece.specs.materialType}, {piece.specs.thickness}
                        </span>
                        {piece.notes && (
                          <div className="mt-1 text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-100">
                            <span className="font-medium">Notes:</span> {piece.notes}
                          </div>
                        )}
                      </div>
                      <button
                        className="text-red-600 hover:text-red-800 ml-2 p-1 rounded hover:bg-red-50 transition-colors"
                        onClick={() => onRemovePiece(piece.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Preview Panel - Takes 8 columns on large screens */}
      <div className="lg:col-span-8 bg-white p-6 rounded-lg shadow-lg border border-gray-100">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Preview</h2>
        <div className="border-2 border-gray-200 rounded-lg p-4 flex items-center justify-center bg-gray-50">
          <canvas 
            ref={canvasRef} 
            width={800} 
            height={600} 
            className="max-w-full h-auto shadow-sm"
          />
        </div>
        <div className="mt-4 flex justify-end space-x-4">
          <button 
            className="px-6 py-2 bg-gradient-to-r from-gray-200 to-gray-100 text-gray-800 rounded-md hover:from-gray-300 hover:to-gray-200 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            onClick={handleDownloadPNG}
          >
            Download PNG
          </button>
          <button 
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-md hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:opacity-70 disabled:transform-none disabled:shadow-none"
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
          </button>
        </div>
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