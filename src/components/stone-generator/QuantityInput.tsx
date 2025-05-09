"use client"

import React from 'react'

export interface QuantityInputProps {
  quantity: number;
  onQuantityChange: (quantity: number) => void;
}

export function QuantityInput({ 
  quantity, 
  onQuantityChange 
}: QuantityInputProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Quantity</h3>
      
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
          Number of Pieces
        </label>
        <div className="relative rounded-md shadow-sm max-w-[150px]">
          <input
            type="number"
            id="quantity"
            className="block w-full rounded-md border-gray-300 pl-3 pr-3 py-2 focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-800"
            value={quantity}
            onChange={(e) => onQuantityChange(parseInt(e.target.value) || 1)}
            min="1"
            step="1"
          />
        </div>
      </div>
    </div>
  )
}
