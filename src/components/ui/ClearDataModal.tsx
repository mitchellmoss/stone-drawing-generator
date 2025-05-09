"use client"

import React from 'react'

interface ClearDataModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ClearDataModal({ onConfirm, onCancel }: ClearDataModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl transform transition-all animate-fade-in">
        <h3 className="text-xl font-bold text-gray-900 mb-4">Clear All Data?</h3>
        
        <p className="text-gray-700 mb-6">
          This will permanently delete all your saved stone pieces and settings. 
          This action cannot be undone.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
            onClick={onCancel}
          >
            Cancel
          </button>
          
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            onClick={onConfirm}
          >
            Clear All Data
          </button>
        </div>
      </div>
    </div>
  )
}
