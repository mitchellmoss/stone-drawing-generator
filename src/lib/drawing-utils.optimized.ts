"use client"

import { StoneSpecifications } from '@/types/stone';
import { decimalToFraction } from '@/lib/fraction-utils';

// Cache for grid patterns
const gridPatternCache = new Map<string, CanvasPattern>();

/**
 * Utility functions for drawing stone mockups on a canvas
 */

/**
 * Creates a cached grid pattern for better performance
 */
function getGridPattern(ctx: CanvasRenderingContext2D, scale: number): CanvasPattern | null {
  const cacheKey = `grid-${scale}`;
  
  if (gridPatternCache.has(cacheKey)) {
    return gridPatternCache.get(cacheKey)!;
  }
  
  // Create pattern canvas
  const patternCanvas = document.createElement('canvas');
  const patternSize = Math.round(scale); // Grid size in pixels
  patternCanvas.width = patternSize;
  patternCanvas.height = patternSize;
  
  const patternCtx = patternCanvas.getContext('2d');
  if (!patternCtx) return null;
  
  // Draw grid pattern
  patternCtx.strokeStyle = '#c0c0c0';
  patternCtx.lineWidth = 0.5;
  
  // Draw grid lines
  patternCtx.beginPath();
  patternCtx.moveTo(0, 0);
  patternCtx.lineTo(patternSize, 0);
  patternCtx.moveTo(0, 0);
  patternCtx.lineTo(0, patternSize);
  patternCtx.stroke();
  
  // Create pattern
  const pattern = ctx.createPattern(patternCanvas, 'repeat');
  if (pattern) {
    gridPatternCache.set(cacheKey, pattern);
  }
  
  return pattern;
}

/**
 * Draws a stone piece with specified dimensions and polished edges on a canvas
 * @param ctx Canvas rendering context
 * @param specs Stone specifications
 * @param options Drawing options
 */
export function drawStoneMockup(
  ctx: CanvasRenderingContext2D,
  specs: StoneSpecifications,
  options: {
    showGrid?: boolean;
    showPolishedEdges?: boolean;
    useXMarks?: boolean;
    scale?: number;
    padding?: number;
  } = {}
) {
  const {
    width,
    height,
    polishedEdges,
    materialType,
    thickness,
  } = specs;

  const {
    showGrid = true,
    showPolishedEdges = true,
    useXMarks = true,
    scale = 1,
    padding = 40,
  } = options;

  // Clear canvas
  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  
  // Set background color (light gray for graph paper look)
  ctx.fillStyle = '#f5f5f5';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Calculate scale to fit the stone piece on the canvas
  const maxWidth = canvasWidth - padding * 2;
  const maxHeight = canvasHeight - padding * 2;
  
  const widthScale = maxWidth / width;
  const heightScale = maxHeight / height;
  const finalScale = Math.min(widthScale, heightScale) * scale;

  // Calculate dimensions and position
  const scaledWidth = width * finalScale;
  const scaledHeight = height * finalScale;
  const x = (canvasWidth - scaledWidth) / 2;
  const y = (canvasHeight - scaledHeight) / 2;

  // Draw grid if enabled (optimized version)
  if (showGrid) {
    drawGridOptimized(ctx, x, y, scaledWidth, scaledHeight, finalScale);
  }

  // Draw stone piece
  drawStoneRectangle(ctx, x, y, scaledWidth, scaledHeight);

  // Draw polished edges if enabled
  if (showPolishedEdges) {
    drawPolishedEdgesOptimized(ctx, x, y, scaledWidth, scaledHeight, polishedEdges, useXMarks);
  }

  // Draw dimensions
  drawDimensions(ctx, x, y, scaledWidth, scaledHeight, width, height);

  // Draw material info
  drawMaterialInfo(ctx, x, y, scaledWidth, scaledHeight, materialType, thickness);
}

/**
 * Optimized grid drawing using patterns
 */
function drawGridOptimized(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number
) {
  // Save context state
  ctx.save();
  
  // Clip to stone area
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  
  // Draw minor grid using pattern (every 1/4 inch)
  const minorGridPattern = getGridPattern(ctx, scale * 0.25);
  if (minorGridPattern) {
    ctx.fillStyle = minorGridPattern;
    ctx.fillRect(x, y, width, height);
  }
  
  // Draw major grid lines (every inch) - only draw what's visible
  const majorGridSpacing = 1 * scale;
  
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 0.8;
  
  // Calculate visible range
  const startX = Math.floor(x / majorGridSpacing) * majorGridSpacing;
  const endX = Math.ceil((x + width) / majorGridSpacing) * majorGridSpacing;
  const startY = Math.floor(y / majorGridSpacing) * majorGridSpacing;
  const endY = Math.ceil((y + height) / majorGridSpacing) * majorGridSpacing;
  
  // Batch path operations
  ctx.beginPath();
  
  // Vertical lines
  for (let i = startX; i <= endX; i += majorGridSpacing) {
    if (i >= x && i <= x + width) {
      ctx.moveTo(i, y);
      ctx.lineTo(i, y + height);
    }
  }
  
  // Horizontal lines
  for (let i = startY; i <= endY; i += majorGridSpacing) {
    if (i >= y && i <= y + height) {
      ctx.moveTo(x, i);
      ctx.lineTo(x + width, i);
    }
  }
  
  ctx.stroke();
  
  // Restore context state
  ctx.restore();
}

/**
 * Draws the stone rectangle
 */
function drawStoneRectangle(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  // Draw white rectangle with black border
  ctx.fillStyle = 'white';
  ctx.fillRect(x, y, width, height);
  
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);
}

/**
 * Optimized polished edges drawing
 */
function drawPolishedEdgesOptimized(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  polishedEdges: string[],
  useXMarks: boolean
) {
  if (polishedEdges.length === 0) return;
  
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 4;
  
  // Batch edge drawing
  ctx.beginPath();
  
  // Draw polished edges
  if (polishedEdges.includes('top')) {
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
  }
  
  if (polishedEdges.includes('bottom')) {
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
  }
  
  if (polishedEdges.includes('left')) {
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
  }
  
  if (polishedEdges.includes('right')) {
    ctx.moveTo(x + width, y);
    ctx.lineTo(x + width, y + height);
  }
  
  ctx.stroke();
  
  // Draw X marks if enabled
  if (useXMarks) {
    ctx.lineWidth = 2;
    
    if (polishedEdges.includes('top')) {
      drawXMarksOptimized(ctx, x, y, width, 0, 'horizontal');
    }
    
    if (polishedEdges.includes('bottom')) {
      drawXMarksOptimized(ctx, x, y + height, width, 0, 'horizontal');
    }
    
    if (polishedEdges.includes('left')) {
      drawXMarksOptimized(ctx, x, y, 0, height, 'vertical');
    }
    
    if (polishedEdges.includes('right')) {
      drawXMarksOptimized(ctx, x + width, y, 0, height, 'vertical');
    }
  }
}

/**
 * Optimized X marks drawing using batched path operations
 */
function drawXMarksOptimized(
  ctx: CanvasRenderingContext2D,
  startX: number,
  startY: number,
  width: number,
  height: number,
  direction: 'horizontal' | 'vertical'
) {
  const markSize = 6;
  const spacing = 20;
  
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 2;
  
  // Batch all X marks in a single path
  ctx.beginPath();
  
  if (direction === 'horizontal') {
    // Draw X marks along horizontal edge
    for (let i = spacing; i < width; i += spacing) {
      // First line of X
      ctx.moveTo(startX + i - markSize, startY - markSize);
      ctx.lineTo(startX + i + markSize, startY + markSize);
      
      // Second line of X
      ctx.moveTo(startX + i - markSize, startY + markSize);
      ctx.lineTo(startX + i + markSize, startY - markSize);
    }
  } else {
    // Draw X marks along vertical edge
    for (let i = spacing; i < height; i += spacing) {
      // First line of X
      ctx.moveTo(startX - markSize, startY + i - markSize);
      ctx.lineTo(startX + markSize, startY + i + markSize);
      
      // Second line of X
      ctx.moveTo(startX - markSize, startY + i + markSize);
      ctx.lineTo(startX + markSize, startY + i - markSize);
    }
  }
  
  ctx.stroke();
}

/**
 * Draws dimensions on the mockup
 */
function drawDimensions(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  actualWidth: number,
  actualHeight: number
) {
  ctx.fillStyle = 'black';
  ctx.font = '14px Arial';
  ctx.textAlign = 'center';
  
  // Convert decimal dimensions to fraction strings
  const widthFraction = decimalToFraction(actualWidth);
  const heightFraction = decimalToFraction(actualHeight);
  
  // Width dimension
  ctx.fillText(`${widthFraction}"`, x + width / 2, y + height + 25);
  
  // Height dimension
  ctx.save();
  ctx.translate(x - 25, y + height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(`${heightFraction}"`, 0, 0);
  ctx.restore();
}

/**
 * Draws material information on the mockup
 */
function drawMaterialInfo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  materialType: string,
  thickness: string
) {
  ctx.fillStyle = 'black';
  ctx.font = '12px Arial';
  ctx.textAlign = 'left';
  
  // Format material info
  const materialInfo = `${materialType.charAt(0).toUpperCase() + materialType.slice(1)}, ${thickness}`;
  
  // Draw material info at the bottom right
  ctx.fillText(materialInfo, x + width - ctx.measureText(materialInfo).width - 5, y + height - 5);
}