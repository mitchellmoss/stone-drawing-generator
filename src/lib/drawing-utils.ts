"use client"

import { StoneSpecifications } from '@/types/stone';
import { decimalToFraction } from '@/lib/fraction-utils';

/**
 * Utility functions for drawing stone mockups on a canvas
 */

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
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

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

  // Draw grid if enabled
  if (showGrid) {
    drawGrid(ctx, x, y, scaledWidth, scaledHeight, finalScale);
  }

  // Draw stone piece
  drawStoneRectangle(ctx, x, y, scaledWidth, scaledHeight);

  // Draw polished edges if enabled
  if (showPolishedEdges) {
    drawPolishedEdges(ctx, x, y, scaledWidth, scaledHeight, polishedEdges, useXMarks);
  }

  // Draw dimensions
  drawDimensions(ctx, x, y, scaledWidth, scaledHeight, width, height);

  // Draw material info
  drawMaterialInfo(ctx, x, y, scaledWidth, scaledHeight, materialType, thickness);
}

/**
 * Draws a grid on the canvas
 */
function drawGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  scale: number
) {
  // Draw minor grid lines (every 1/4 inch)
  const gridSpacing = 0.25 * scale;
  
  ctx.strokeStyle = '#c0c0c0';
  ctx.lineWidth = 0.5;
  
  // Vertical lines
  for (let i = 0; i <= width; i += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i, y + height);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let i = 0; i <= height; i += gridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, y + i);
    ctx.lineTo(x + width, y + i);
    ctx.stroke();
  }
  
  // Draw major grid lines (every inch)
  const majorGridSpacing = 1 * scale;
  
  ctx.strokeStyle = '#808080';
  ctx.lineWidth = 0.8;
  
  // Vertical lines
  for (let i = 0; i <= width; i += majorGridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i, y + height);
    ctx.stroke();
  }
  
  // Horizontal lines
  for (let i = 0; i <= height; i += majorGridSpacing) {
    ctx.beginPath();
    ctx.moveTo(x, y + i);
    ctx.lineTo(x + width, y + i);
    ctx.stroke();
  }
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
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.fill();
  ctx.stroke();
}

/**
 * Draws polished edges with red lines and optional X marks
 */
function drawPolishedEdges(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  polishedEdges: string[],
  useXMarks: boolean
) {
  ctx.strokeStyle = 'red';
  ctx.lineWidth = 4;
  
  // Draw polished edges
  if (polishedEdges.includes('top')) {
    // Top edge
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y);
    ctx.stroke();
    
    // Add X marks if enabled
    if (useXMarks) {
      drawXMarks(ctx, x, y, width, 0, 'horizontal');
    }
  }
  
  if (polishedEdges.includes('bottom')) {
    // Bottom edge
    ctx.beginPath();
    ctx.moveTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
    
    // Add X marks if enabled
    if (useXMarks) {
      drawXMarks(ctx, x, y + height, width, 0, 'horizontal');
    }
  }
  
  if (polishedEdges.includes('left')) {
    // Left edge
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();
    
    // Add X marks if enabled
    if (useXMarks) {
      drawXMarks(ctx, x, y, 0, height, 'vertical');
    }
  }
  
  if (polishedEdges.includes('right')) {
    // Right edge
    ctx.beginPath();
    ctx.moveTo(x + width, y);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
    
    // Add X marks if enabled
    if (useXMarks) {
      drawXMarks(ctx, x + width, y, 0, height, 'vertical');
    }
  }
}

/**
 * Draws X marks along an edge
 */
function drawXMarks(
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
  
  if (direction === 'horizontal') {
    // Draw X marks along horizontal edge
    for (let i = spacing; i < width; i += spacing) {
      ctx.beginPath();
      ctx.moveTo(startX + i - markSize, startY - markSize);
      ctx.lineTo(startX + i + markSize, startY + markSize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(startX + i - markSize, startY + markSize);
      ctx.lineTo(startX + i + markSize, startY - markSize);
      ctx.stroke();
    }
  } else {
    // Draw X marks along vertical edge
    for (let i = spacing; i < height; i += spacing) {
      ctx.beginPath();
      ctx.moveTo(startX - markSize, startY + i - markSize);
      ctx.lineTo(startX + markSize, startY + i + markSize);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(startX - markSize, startY + i + markSize);
      ctx.lineTo(startX + markSize, startY + i - markSize);
      ctx.stroke();
    }
  }
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
