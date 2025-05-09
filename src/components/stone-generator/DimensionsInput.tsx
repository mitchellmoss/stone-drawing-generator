"use client"

import React, { useState, useEffect } from 'react'
import { fractionToDecimal, decimalToFraction, isValidFractionString } from '@/lib/fraction-utils'

export interface DimensionsInputProps {
  width: number;
  height: number;
  onWidthChange: (width: number) => void;
  onHeightChange: (height: number) => void;
}

export function DimensionsInput({ 
  width, 
  height, 
  onWidthChange, 
  onHeightChange 
}: DimensionsInputProps) {
  // State for fraction string inputs
  const [widthStr, setWidthStr] = useState<string>(decimalToFraction(width));
  const [heightStr, setHeightStr] = useState<string>(decimalToFraction(height));
  
  // State for input validation
  const [widthIsValid, setWidthIsValid] = useState<boolean>(true);
  const [heightIsValid, setHeightIsValid] = useState<boolean>(true);

  // Update fraction strings when props change (e.g., from localStorage)
  useEffect(() => {
    setWidthStr(decimalToFraction(width));
  }, [width]);

  useEffect(() => {
    setHeightStr(decimalToFraction(height));
  }, [height]);

  // Handle width input change
  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidthStr = e.target.value;
    setWidthStr(newWidthStr);
    
    // Validate and convert to decimal
    const isValid = isValidFractionString(newWidthStr);
    setWidthIsValid(isValid);
    
    if (isValid) {
      const decimal = fractionToDecimal(newWidthStr);
      if (decimal !== null) {
        onWidthChange(decimal);
      }
    }
  };

  // Handle height input change
  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeightStr = e.target.value;
    setHeightStr(newHeightStr);
    
    // Validate and convert to decimal
    const isValid = isValidFractionString(newHeightStr);
    setHeightIsValid(isValid);
    
    if (isValid) {
      const decimal = fractionToDecimal(newHeightStr);
      if (decimal !== null) {
        onHeightChange(decimal);
      }
    }
  };

  // Handle blur events to format the input
  const handleWidthBlur = () => {
    if (widthIsValid) {
      const decimal = fractionToDecimal(widthStr);
      if (decimal !== null) {
        setWidthStr(decimalToFraction(decimal));
      }
    }
  };

  const handleHeightBlur = () => {
    if (heightIsValid) {
      const decimal = fractionToDecimal(heightStr);
      if (decimal !== null) {
        setHeightStr(decimalToFraction(decimal));
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Dimensions (inches)</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="width" className="block text-sm font-medium text-gray-700 mb-1">
            Width
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              id="width"
              className={`block w-full rounded-md border-gray-300 pl-3 pr-8 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-800 ${!widthIsValid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Width (e.g., 2-1/2)"
              value={widthStr}
              onChange={handleWidthChange}
              onBlur={handleWidthBlur}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">in</span>
            </div>
          </div>
          {!widthIsValid && (
            <p className="mt-1 text-sm text-red-600">
              Please enter a valid fraction (e.g., 2, 1/2, or 2-1/2)
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-1">
            Height
          </label>
          <div className="relative rounded-md shadow-sm">
            <input
              type="text"
              id="height"
              className={`block w-full rounded-md border-gray-300 pl-3 pr-8 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-800 ${!heightIsValid ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              placeholder="Height (e.g., 2-1/2)"
              value={heightStr}
              onChange={handleHeightChange}
              onBlur={handleHeightBlur}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">in</span>
            </div>
          </div>
          {!heightIsValid && (
            <p className="mt-1 text-sm text-red-600">
              Please enter a valid fraction (e.g., 2, 1/2, or 2-1/2)
            </p>
          )}
        </div>
      </div>
      
      <div className="text-sm text-gray-500 mt-1">
        <p>Supported formats: whole numbers (2), fractions (1/2), or mixed numbers (2-1/2)</p>
      </div>
    </div>
  )
}
