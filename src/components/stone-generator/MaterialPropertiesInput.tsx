"use client"

import React from 'react'

export interface MaterialPropertiesInputProps {
  materialType: string;
  thickness: string;
  onMaterialTypeChange: (type: string) => void;
  onThicknessChange: (thickness: string) => void;
}

export function MaterialPropertiesInput({ 
  materialType, 
  thickness, 
  onMaterialTypeChange, 
  onThicknessChange 
}: MaterialPropertiesInputProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Material Properties</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="material-type" className="block text-sm font-medium text-gray-700 mb-1">
            Material Type
          </label>
          <select
            id="material-type"
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-800"
            value={materialType}
            onChange={(e) => onMaterialTypeChange(e.target.value)}
          >
            <option value="quartz">Quartz</option>
            <option value="marble">Marble</option>
            <option value="granite">Granite</option>
            <option value="quartzite">Quartzite</option>
            <option value="soapstone">Soapstone</option>
            <option value="porcelain">Porcelain</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="thickness" className="block text-sm font-medium text-gray-700 mb-1">
            Thickness
          </label>
          <select
            id="thickness"
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm text-gray-800"
            value={thickness}
            onChange={(e) => onThicknessChange(e.target.value)}
          >
            <option value="2cm">2cm</option>
            <option value="3cm">3cm</option>
            <option value="1.2cm">1.2cm</option>
            <option value="2.5cm">2.5cm</option>
          </select>
        </div>
      </div>
    </div>
  )
}
