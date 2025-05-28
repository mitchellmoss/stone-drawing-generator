"use client"

interface PerformanceMetrics {
  renderTime: number;
  exportTime: number;
  canvasOperations: number;
  memoryUsage?: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    renderTime: 0,
    exportTime: 0,
    canvasOperations: 0
  };
  
  private startTimes = new Map<string, number>();
  
  // Start measuring a specific operation
  startMeasure(operation: string) {
    this.startTimes.set(operation, performance.now());
  }
  
  // End measuring and record the duration
  endMeasure(operation: string): number {
    const startTime = this.startTimes.get(operation);
    if (!startTime) {
      console.warn(`No start time found for operation: ${operation}`);
      return 0;
    }
    
    const duration = performance.now() - startTime;
    this.startTimes.delete(operation);
    
    // Update metrics based on operation type
    if (operation.includes('render')) {
      this.metrics.renderTime = duration;
    } else if (operation.includes('export')) {
      this.metrics.exportTime = duration;
    }
    
    return duration;
  }
  
  // Increment canvas operation counter
  incrementCanvasOps() {
    this.metrics.canvasOperations++;
  }
  
  // Reset canvas operation counter
  resetCanvasOps() {
    this.metrics.canvasOperations = 0;
  }
  
  // Get current metrics
  getMetrics(): PerformanceMetrics {
    // Try to get memory usage if available
    if ('memory' in performance) {
      this.metrics.memoryUsage = (performance as any).memory.usedJSHeapSize;
    }
    
    return { ...this.metrics };
  }
  
  // Log metrics to console
  logMetrics(label: string = 'Performance Metrics') {
    const metrics = this.getMetrics();
    console.group(label);
    console.log(`Render Time: ${metrics.renderTime.toFixed(2)}ms`);
    console.log(`Export Time: ${metrics.exportTime.toFixed(2)}ms`);
    console.log(`Canvas Operations: ${metrics.canvasOperations}`);
    if (metrics.memoryUsage) {
      console.log(`Memory Usage: ${(metrics.memoryUsage / 1024 / 1024).toFixed(2)}MB`);
    }
    console.groupEnd();
  }
  
  // Check if performance is within acceptable limits
  isPerformanceAcceptable(): boolean {
    const metrics = this.getMetrics();
    
    // Define thresholds
    const RENDER_TIME_THRESHOLD = 100; // 100ms
    const EXPORT_TIME_THRESHOLD = 500; // 500ms
    
    return metrics.renderTime < RENDER_TIME_THRESHOLD && 
           metrics.exportTime < EXPORT_TIME_THRESHOLD;
  }
  
  // Get performance warnings
  getWarnings(): string[] {
    const warnings: string[] = [];
    const metrics = this.getMetrics();
    
    if (metrics.renderTime > 100) {
      warnings.push(`Slow render time: ${metrics.renderTime.toFixed(2)}ms`);
    }
    
    if (metrics.exportTime > 500) {
      warnings.push(`Slow export time: ${metrics.exportTime.toFixed(2)}ms`);
    }
    
    if (metrics.canvasOperations > 1000) {
      warnings.push(`High canvas operation count: ${metrics.canvasOperations}`);
    }
    
    return warnings;
  }
}

// Create singleton instance
export const perfMonitor = new PerformanceMonitor();

// Helper functions for easy usage
export function measureRender<T>(operation: () => T): T {
  perfMonitor.startMeasure('render');
  const result = operation();
  perfMonitor.endMeasure('render');
  return result;
}

export async function measureRenderAsync<T>(operation: () => Promise<T>): Promise<T> {
  perfMonitor.startMeasure('render');
  try {
    const result = await operation();
    return result;
  } finally {
    perfMonitor.endMeasure('render');
  }
}

export function measureExport<T>(operation: () => T): T {
  perfMonitor.startMeasure('export');
  const result = operation();
  perfMonitor.endMeasure('export');
  return result;
}

export async function measureExportAsync<T>(operation: () => Promise<T>): Promise<T> {
  perfMonitor.startMeasure('export');
  try {
    const result = await operation();
    return result;
  } finally {
    perfMonitor.endMeasure('export');
  }
}

// Development mode performance logging
if (process.env.NODE_ENV === 'development') {
  // Log performance metrics every 10 seconds in development
  setInterval(() => {
    const warnings = perfMonitor.getWarnings();
    if (warnings.length > 0) {
      console.warn('Performance warnings:', warnings);
      perfMonitor.logMetrics();
    }
  }, 10000);
}