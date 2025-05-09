"use client"

import React, { useState, useEffect } from 'react'
import { StoneGenerator } from '@/components/stone-generator/StoneGenerator'
import { MultiPieceExport } from '@/components/stone-generator/MultiPieceExport'
import { StonePiece } from '@/types/stone'
import { useLocalStorage, clearAllStoredData } from '@/hooks/useLocalStorage'
import { ClearDataModal } from '@/components/ui/ClearDataModal'

export default function GeneratorPage() {
  // Use localStorage hook instead of useState
  const [savedPieces, setSavedPieces] = useLocalStorage<StonePiece[]>('stone-mockup-generator:savedPieces', []);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  
  const handleSavePiece = (piece: StonePiece) => {
    setSavedPieces(prev => [...prev, piece]);
  };
  
  const handleRemovePiece = (id: string) => {
    setSavedPieces(prev => prev.filter(piece => piece.id !== id));
  };
  
  const handleClearAllData = () => {
    // Show confirmation modal
    setShowClearDataModal(true);
  };
  
  const confirmClearData = () => {
    // Clear all data from localStorage
    const success = clearAllStoredData();
    
    if (success) {
      // Reset state
      setSavedPieces([]);
      // Close modal
      setShowClearDataModal(false);
    } else {
      alert('Failed to clear data. Please try again.');
    }
  };
  
  const cancelClearData = () => {
    // Close modal without clearing data
    setShowClearDataModal(false);
  };
  
  return (
    <main className="container mx-auto px-4 py-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Stone Mockup Generator</h1>
        
        <button
          className="px-4 py-2 bg-red-100 text-red-800 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
          onClick={handleClearAllData}
        >
          Clear All Data
        </button>
      </div>
      
      <StoneGenerator 
        onSavePiece={handleSavePiece}
        onRemovePiece={handleRemovePiece}
        savedPieces={savedPieces}
      />
      
      <MultiPieceExport savedPieces={savedPieces} />
      
      {/* Clear Data Confirmation Modal */}
      {showClearDataModal && (
        <ClearDataModal 
          onConfirm={confirmClearData}
          onCancel={cancelClearData}
        />
      )}
    </main>
  )
}
