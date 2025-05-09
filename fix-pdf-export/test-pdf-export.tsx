"use client";

import React from 'react';
import { exportToPDF } from '@/lib/export-utils';

// Test function to verify PDF export with various edge cases
function TestPDFExport() {
  // Create a canvas element for testing
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  
  // Test cases with different specs configurations
  const testCases = [
    {
      name: "Complete specs",
      specs: {
        width: 24,
        height: 4,
        displayWidth: "24",
        displayHeight: "4",
        materialType: "Quartz",
        thickness: "2cm",
        quantity: 1,
        polishedEdges: ["top", "bottom"]
      }
    },
    {
      name: "Missing polishedEdges",
      specs: {
        width: 24,
        height: 4,
        displayWidth: "24",
        displayHeight: "4",
        materialType: "Quartz",
        thickness: "2cm",
        quantity: 1
      }
    },
    {
      name: "Empty polishedEdges array",
      specs: {
        width: 24,
        height: 4,
        displayWidth: "24",
        displayHeight: "4",
        materialType: "Quartz",
        thickness: "2cm",
        quantity: 1,
        polishedEdges: []
      }
    },
    {
      name: "With fractions",
      specs: {
        width: 24.5,
        height: 4.25,
        displayWidth: "24-1/2",
        displayHeight: "4-1/4",
        materialType: "Quartz",
        thickness: "2cm",
        quantity: 1,
        polishedEdges: ["top", "bottom"]
      }
    }
  ];
  
  // Run tests
  const runTests = async () => {
    if (!canvasRef.current) return;
    
    // Test each case
    for (const testCase of testCases) {
      try {
        console.log(`Testing case: ${testCase.name}`);
        await exportToPDF(canvasRef.current, testCase.specs, `Test notes for ${testCase.name}`);
        console.log(`✅ Test passed: ${testCase.name}`);
      } catch (error) {
        console.error(`❌ Test failed: ${testCase.name}`, error);
      }
    }
  };
  
  return (
    <div>
      <h1>PDF Export Test</h1>
      <canvas ref={canvasRef} width="800" height="600" style={{ display: 'none' }}></canvas>
      <button onClick={runTests}>Run Tests</button>
      <div>Check console for test results</div>
    </div>
  );
}

export default TestPDFExport;
