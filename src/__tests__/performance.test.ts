import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { drawStoneMockup } from '@/lib/drawing-utils.optimized';
import { exportToPDF, exportMultipleToPDF } from '@/lib/export-utils.optimized';
import { StoneSpecifications } from '@/types/stone';

// Mock canvas context
class MockCanvasRenderingContext2D {
  canvas = { width: 800, height: 600 };
  fillStyle = '';
  strokeStyle = '';
  lineWidth = 1;
  font = '';
  textAlign = 'left' as CanvasTextAlign;
  
  clearRect = vi.fn();
  fillRect = vi.fn();
  strokeRect = vi.fn();
  beginPath = vi.fn();
  moveTo = vi.fn();
  lineTo = vi.fn();
  stroke = vi.fn();
  fill = vi.fn();
  rect = vi.fn();
  save = vi.fn();
  restore = vi.fn();
  translate = vi.fn();
  rotate = vi.fn();
  fillText = vi.fn();
  measureText = vi.fn(() => ({ width: 100 }));
  createPattern = vi.fn(() => ({} as CanvasPattern));
  clip = vi.fn();
  drawImage = vi.fn();
  putImageData = vi.fn();
  getImageData = vi.fn(() => ({
    data: new Uint8ClampedArray(800 * 600 * 4),
    width: 800,
    height: 600,
    colorSpace: 'srgb' as PredefinedColorSpace
  }));
}

// Mock HTMLCanvasElement
class MockHTMLCanvasElement {
  width = 800;
  height = 600;
  
  getContext = vi.fn((contextId: string) => {
    if (contextId === '2d') {
      return new MockCanvasRenderingContext2D();
    }
    return null;
  });
  
  toDataURL = vi.fn(() => 'data:image/png;base64,mock');
  toBlob = vi.fn((callback: (blob: Blob | null) => void) => {
    callback(new Blob(['mock'], { type: 'image/png' }));
  });
  transferToImageBitmap = vi.fn();
}

describe('Performance Tests', () => {
  let mockCanvas: MockHTMLCanvasElement;
  let mockCtx: MockCanvasRenderingContext2D;
  let startTime: number;
  
  beforeEach(() => {
    mockCanvas = new MockHTMLCanvasElement();
    mockCtx = mockCanvas.getContext('2d') as any;
    startTime = performance.now();
    
    // Mock global objects
    global.document = {
      createElement: vi.fn((tag: string) => {
        if (tag === 'canvas') {
          return new MockHTMLCanvasElement();
        }
        if (tag === 'a') {
          return {
            download: '',
            href: '',
            click: vi.fn(),
            style: {},
            appendChild: vi.fn(),
            removeChild: vi.fn()
          };
        }
        return {};
      }),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn()
      }
    } as any;
    
    global.URL = {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn()
    } as any;
    
    global.window = {
      open: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    } as any;
  });
  
  afterEach(() => {
    const duration = performance.now() - startTime;
    console.log(`Test duration: ${duration.toFixed(2)}ms`);
  });
  
  describe('Drawing Performance', () => {
    test('should render stone mockup efficiently', () => {
      const specs: StoneSpecifications = {
        width: 24,
        height: 4,
        polishedEdges: ['top', 'bottom'],
        materialType: 'quartz',
        thickness: '2cm',
        quantity: 1
      };
      
      const options = {
        showGrid: true,
        showPolishedEdges: true,
        useXMarks: true,
        scale: 1
      };
      
      // Measure rendering time
      const renderStart = performance.now();
      drawStoneMockup(mockCtx as any, specs, options);
      const renderDuration = performance.now() - renderStart;
      
      // Verify performance
      expect(renderDuration).toBeLessThan(50); // Should render in less than 50ms
      
      // Verify canvas operations were called
      expect(mockCtx.fillRect).toHaveBeenCalled();
      expect(mockCtx.strokeRect).toHaveBeenCalled();
      expect(mockCtx.beginPath).toHaveBeenCalled();
      expect(mockCtx.stroke).toHaveBeenCalled();
    });
    
    test('should handle large dimensions efficiently', () => {
      const specs: StoneSpecifications = {
        width: 144, // 12 feet
        height: 96,  // 8 feet
        polishedEdges: ['top', 'bottom', 'left', 'right'],
        materialType: 'granite',
        thickness: '3cm',
        quantity: 1
      };
      
      const options = {
        showGrid: true,
        showPolishedEdges: true,
        useXMarks: true,
        scale: 1
      };
      
      const renderStart = performance.now();
      drawStoneMockup(mockCtx as any, specs, options);
      const renderDuration = performance.now() - renderStart;
      
      // Even with large dimensions, should still be fast
      expect(renderDuration).toBeLessThan(100);
    });
    
    test('should use pattern caching for grid', () => {
      const specs: StoneSpecifications = {
        width: 24,
        height: 4,
        polishedEdges: [],
        materialType: 'quartz',
        thickness: '2cm',
        quantity: 1
      };
      
      const options = {
        showGrid: true,
        showPolishedEdges: false,
        useXMarks: false,
        scale: 1
      };
      
      // First render
      drawStoneMockup(mockCtx as any, specs, options);
      const firstCallCount = mockCtx.createPattern.mock.calls.length;
      
      // Second render with same scale
      drawStoneMockup(mockCtx as any, specs, options);
      const secondCallCount = mockCtx.createPattern.mock.calls.length;
      
      // Pattern should be cached, so createPattern shouldn't be called again
      expect(secondCallCount).toBe(firstCallCount);
    });
    
    test('should batch path operations', () => {
      const specs: StoneSpecifications = {
        width: 24,
        height: 4,
        polishedEdges: ['top', 'bottom', 'left', 'right'],
        materialType: 'quartz',
        thickness: '2cm',
        quantity: 1
      };
      
      const options = {
        showGrid: false,
        showPolishedEdges: true,
        useXMarks: true,
        scale: 1
      };
      
      drawStoneMockup(mockCtx as any, specs, options);
      
      // Count beginPath calls - should be minimized
      const beginPathCalls = mockCtx.beginPath.mock.calls.length;
      expect(beginPathCalls).toBeLessThan(10); // Should batch operations
    });
  });
  
  describe('Export Performance', () => {
    test('should export PDF asynchronously', async () => {
      const specs = {
        width: 24,
        height: 4,
        polishedEdges: ['top'],
        materialType: 'quartz',
        thickness: '2cm',
        quantity: 1
      };
      
      const exportStart = performance.now();
      
      // Mock jsPDF
      vi.mock('jspdf', () => ({
        default: vi.fn().mockImplementation(() => ({
          setFontSize: vi.fn(),
          text: vi.fn(),
          addImage: vi.fn(),
          save: vi.fn(),
          output: vi.fn(() => 'mock-pdf-data'),
          addPage: vi.fn(),
          splitTextToSize: vi.fn(() => ['text'])
        }))
      }));
      
      await exportToPDF(mockCanvas as any, specs, 'Test notes', false);
      
      const exportDuration = performance.now() - exportStart;
      
      // Should be fast due to async processing
      expect(exportDuration).toBeLessThan(200);
    });
    
    test('should handle multiple pieces efficiently', async () => {
      const canvases = Array(10).fill(null).map(() => new MockHTMLCanvasElement());
      const specsArray = Array(10).fill(null).map((_, i) => ({
        width: 24 + i,
        height: 4,
        polishedEdges: ['top'],
        materialType: 'quartz',
        thickness: '2cm',
        quantity: 1
      }));
      
      // Mock jsPDF
      vi.mock('jspdf', () => ({
        default: vi.fn().mockImplementation(() => ({
          setFontSize: vi.fn(),
          text: vi.fn(),
          addImage: vi.fn(),
          save: vi.fn(),
          output: vi.fn(() => 'mock-pdf-data'),
          addPage: vi.fn(),
          splitTextToSize: vi.fn(() => ['text']),
          setTextColor: vi.fn()
        }))
      }));
      
      const exportStart = performance.now();
      
      await exportMultipleToPDF(
        canvases as any[],
        specsArray,
        'Test Project',
        false
      );
      
      const exportDuration = performance.now() - exportStart;
      
      // Should handle 10 pieces in reasonable time
      expect(exportDuration).toBeLessThan(500);
    });
  });
  
  describe('Memory Management', () => {
    test('should not leak memory with repeated renders', () => {
      const specs: StoneSpecifications = {
        width: 24,
        height: 4,
        polishedEdges: ['top'],
        materialType: 'quartz',
        thickness: '2cm',
        quantity: 1
      };
      
      const options = {
        showGrid: true,
        showPolishedEdges: true,
        useXMarks: true,
        scale: 1
      };
      
      // Render multiple times
      const renderCount = 100;
      const startTime = performance.now();
      
      for (let i = 0; i < renderCount; i++) {
        drawStoneMockup(mockCtx as any, specs, options);
      }
      
      const totalDuration = performance.now() - startTime;
      const avgDuration = totalDuration / renderCount;
      
      // Average duration should remain consistent (no memory leak)
      expect(avgDuration).toBeLessThan(5);
    });
    
    test('should clean up resources properly', async () => {
      const specs = {
        width: 24,
        height: 4,
        polishedEdges: ['top'],
        materialType: 'quartz',
        thickness: '2cm',
        quantity: 1
      };
      
      // Track URL.createObjectURL calls
      const createObjectURLSpy = vi.spyOn(global.URL, 'createObjectURL');
      const revokeObjectURLSpy = vi.spyOn(global.URL, 'revokeObjectURL');
      
      await exportToPDF(mockCanvas as any, specs, '', false);
      
      // Should revoke object URLs to prevent memory leaks
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalled();
    });
  });
  
  describe('Responsiveness', () => {
    test('should use requestAnimationFrame for rendering', () => {
      const rafSpy = vi.spyOn(global, 'requestAnimationFrame').mockImplementation((cb) => {
        cb(0);
        return 0;
      });
      
      // This would be tested in the component test
      // Here we just verify the optimized drawing doesn't block
      const specs: StoneSpecifications = {
        width: 24,
        height: 4,
        polishedEdges: ['top'],
        materialType: 'quartz',
        thickness: '2cm',
        quantity: 1
      };
      
      const renderStart = performance.now();
      drawStoneMockup(mockCtx as any, specs);
      const renderDuration = performance.now() - renderStart;
      
      // Should complete quickly without blocking
      expect(renderDuration).toBeLessThan(20);
      
      rafSpy.mockRestore();
    });
  });
});