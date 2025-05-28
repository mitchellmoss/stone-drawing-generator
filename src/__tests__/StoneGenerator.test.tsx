import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { StoneGenerator } from '@/components/stone-generator/StoneGenerator';
import { StonePiece } from '@/types/stone';

// Mock the optimized utilities
vi.mock('@/lib/drawing-utils.optimized', () => ({
  drawStoneMockup: vi.fn()
}));

vi.mock('@/lib/export-utils.optimized', () => ({
  exportToPDF: vi.fn().mockResolvedValue(undefined),
  exportMultipleToPDF: vi.fn().mockResolvedValue(undefined)
}));

// Mock useLocalStorage hook
vi.mock('@/hooks/useLocalStorage', () => ({
  useLocalStorage: vi.fn((key: string, initialValue: any) => {
    const [value, setValue] = React.useState(initialValue);
    return [value, setValue];
  })
}));

// Mock canvas
class MockCanvasRenderingContext2D {
  clearRect = vi.fn();
  fillRect = vi.fn();
  strokeRect = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  stroke = vi.fn();
  fill = vi.fn();
  drawImage = vi.fn();
}

class MockHTMLCanvasElement {
  width = 800;
  height = 600;
  
  getContext = vi.fn(() => new MockCanvasRenderingContext2D());
  toDataURL = vi.fn(() => 'data:image/png;base64,mock');
  toBlob = vi.fn((callback: (blob: Blob | null) => void) => {
    callback(new Blob(['mock'], { type: 'image/png' }));
  });
}

// Setup canvas mock
Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: vi.fn(() => new MockCanvasRenderingContext2D())
});

describe('StoneGenerator Component', () => {
  const mockOnSavePiece = vi.fn();
  const mockOnRemovePiece = vi.fn();
  const mockSavedPieces: StonePiece[] = [];
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock URL API
    global.URL.createObjectURL = vi.fn(() => 'blob:mock');
    global.URL.revokeObjectURL = vi.fn();
    
    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((cb) => {
      cb(0);
      return 0;
    });
    
    global.cancelAnimationFrame = vi.fn();
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  test('renders without crashing', () => {
    render(
      <StoneGenerator
        onSavePiece={mockOnSavePiece}
        onRemovePiece={mockOnRemovePiece}
        savedPieces={mockSavedPieces}
      />
    );
    
    expect(screen.getByText('Stone Specifications')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });
  
  test('updates dimensions efficiently', async () => {
    const { rerender } = render(
      <StoneGenerator
        onSavePiece={mockOnSavePiece}
        onRemovePiece={mockOnRemovePiece}
        savedPieces={mockSavedPieces}
      />
    );
    
    const widthInput = screen.getByLabelText(/Width/i);
    const heightInput = screen.getByLabelText(/Height/i);
    
    // Change dimensions
    fireEvent.change(widthInput, { target: { value: '36' } });
    fireEvent.change(heightInput, { target: { value: '6' } });
    
    // Wait for debounced update
    await waitFor(() => {
      expect(requestAnimationFrame).toHaveBeenCalled();
    }, { timeout: 100 });
    
    // Verify canvas redraw was requested
    expect(global.requestAnimationFrame).toHaveBeenCalled();
  });
  
  test('handles polished edges toggle efficiently', async () => {
    render(
      <StoneGenerator
        onSavePiece={mockOnSavePiece}
        onRemovePiece={mockOnRemovePiece}
        savedPieces={mockSavedPieces}
      />
    );
    
    const topEdgeCheckbox = screen.getByLabelText(/Top Edge/i);
    
    // Toggle edge multiple times rapidly
    fireEvent.click(topEdgeCheckbox);
    fireEvent.click(topEdgeCheckbox);
    fireEvent.click(topEdgeCheckbox);
    
    // Should batch updates efficiently
    await waitFor(() => {
      expect(requestAnimationFrame).toHaveBeenCalled();
    });
    
    // Should not call requestAnimationFrame excessively
    expect(global.requestAnimationFrame).toHaveBeenCalledTimes(1);
  });
  
  test('saves piece with current specifications', () => {
    render(
      <StoneGenerator
        onSavePiece={mockOnSavePiece}
        onRemovePiece={mockOnRemovePiece}
        savedPieces={mockSavedPieces}
      />
    );
    
    const saveButton = screen.getByText('Save This Piece');
    
    fireEvent.click(saveButton);
    
    expect(mockOnSavePiece).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        specs: expect.objectContaining({
          width: expect.any(Number),
          height: expect.any(Number),
          polishedEdges: expect.any(Array),
          materialType: expect.any(String),
          thickness: expect.any(String),
          quantity: expect.any(Number)
        }),
        notes: expect.any(String)
      })
    );
  });
  
  test('exports PNG efficiently', async () => {
    render(
      <StoneGenerator
        onSavePiece={mockOnSavePiece}
        onRemovePiece={mockOnRemovePiece}
        savedPieces={mockSavedPieces}
      />
    );
    
    const downloadPNGButton = screen.getByText('Download PNG');
    
    fireEvent.click(downloadPNGButton);
    
    // Should use blob for better performance
    await waitFor(() => {
      const canvas = document.querySelector('canvas');
      expect(canvas?.toBlob).toHaveBeenCalled();
    });
    
    // Verify URL handling
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });
  
  test('exports PDF asynchronously', async () => {
    const { exportToPDF } = await import('@/lib/export-utils.optimized');
    
    render(
      <StoneGenerator
        onSavePiece={mockOnSavePiece}
        onRemovePiece={mockOnRemovePiece}
        savedPieces={mockSavedPieces}
      />
    );
    
    const downloadPDFButton = screen.getByText('Download PDF');
    
    fireEvent.click(downloadPDFButton);
    
    // Should show loading state
    expect(screen.getByText('Generating PDF...')).toBeInTheDocument();
    
    // Wait for async completion
    await waitFor(() => {
      expect(exportToPDF).toHaveBeenCalled();
    });
    
    // Should return to normal state
    await waitFor(() => {
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });
  });
  
  test('handles display options changes efficiently', async () => {
    render(
      <StoneGenerator
        onSavePiece={mockOnSavePiece}
        onRemovePiece={mockOnRemovePiece}
        savedPieces={mockSavedPieces}
      />
    );
    
    const showGridCheckbox = screen.getByLabelText(/Show Grid/i);
    const scaleSlider = screen.getByLabelText(/Scale/i);
    
    // Change multiple options rapidly
    fireEvent.click(showGridCheckbox);
    fireEvent.change(scaleSlider, { target: { value: '1.5' } });
    fireEvent.change(scaleSlider, { target: { value: '1.8' } });
    fireEvent.change(scaleSlider, { target: { value: '2.0' } });
    
    // Should batch updates
    await waitFor(() => {
      expect(requestAnimationFrame).toHaveBeenCalled();
    });
    
    // Should use requestAnimationFrame for smooth updates
    expect(global.requestAnimationFrame).toHaveBeenCalled();
  });
  
  test('displays saved pieces efficiently', () => {
    const savedPieces: StonePiece[] = Array(20).fill(null).map((_, i) => ({
      id: `piece-${i}`,
      specs: {
        width: 24 + i,
        height: 4,
        polishedEdges: ['top'],
        materialType: 'quartz',
        thickness: '2cm',
        quantity: 1
      },
      notes: `Test piece ${i}`
    }));
    
    render(
      <StoneGenerator
        onSavePiece={mockOnSavePiece}
        onRemovePiece={mockOnRemovePiece}
        savedPieces={savedPieces}
      />
    );
    
    // Should display count
    expect(screen.getByText('Saved Pieces (20)')).toBeInTheDocument();
    
    // Should use virtual scrolling (max-height with overflow)
    const savedPiecesList = screen.getByText('Saved Pieces (20)').nextElementSibling;
    expect(savedPiecesList).toHaveClass('max-h-60', 'overflow-y-auto');
  });
  
  test('removes piece efficiently', () => {
    const savedPieces: StonePiece[] = [{
      id: 'test-piece-1',
      specs: {
        width: 24,
        height: 4,
        polishedEdges: ['top'],
        materialType: 'quartz',
        thickness: '2cm',
        quantity: 1
      },
      notes: 'Test piece'
    }];
    
    render(
      <StoneGenerator
        onSavePiece={mockOnSavePiece}
        onRemovePiece={mockOnRemovePiece}
        savedPieces={savedPieces}
      />
    );
    
    const removeButton = screen.getByText('Remove');
    
    fireEvent.click(removeButton);
    
    expect(mockOnRemovePiece).toHaveBeenCalledWith('test-piece-1');
  });
  
  test('handles errors gracefully', async () => {
    // Mock export failure
    const { exportToPDF } = await import('@/lib/export-utils.optimized');
    vi.mocked(exportToPDF).mockRejectedValueOnce(new Error('Export failed'));
    
    render(
      <StoneGenerator
        onSavePiece={mockOnSavePiece}
        onRemovePiece={mockOnRemovePiece}
        savedPieces={mockSavedPieces}
      />
    );
    
    const downloadPDFButton = screen.getByText('Download PDF');
    
    fireEvent.click(downloadPDFButton);
    
    // Should show error toast
    await waitFor(() => {
      expect(screen.getByText(/Error exporting to PDF/i)).toBeInTheDocument();
    });
    
    // Should recover to normal state
    await waitFor(() => {
      expect(screen.getByText('Download PDF')).toBeInTheDocument();
    });
  });
});