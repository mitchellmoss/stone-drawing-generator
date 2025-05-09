"use client"

import React from 'react'

export interface NotesInputProps {
  notes: string;
  onNotesChange: (notes: string) => void;
}

export function NotesInput({ 
  notes, 
  onNotesChange 
}: NotesInputProps) {
  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Notes</h3>
      
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Additional Information
        </label>
        <textarea
          id="notes"
          rows={4}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm text-gray-800"
          placeholder="Add notes about this piece (e.g., location, special instructions, client details)"
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
        />
      </div>
    </div>
  )
}
