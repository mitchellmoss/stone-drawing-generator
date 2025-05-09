"use client"

import React, { useState } from 'react'
import { StoneGenerator } from './StoneGenerator'
import { MultiPieceExport } from './MultiPieceExport'
import { StonePiece } from '@/types/stone'

export function StoneMockupApp() {
  const [savedPieces, setSavedPieces] = useState<StonePiece[]>([])

  const handleSavePiece = (piece: StonePiece) => {
    setSavedPieces(prev => [...prev, piece])
  }

  const handleRemovePiece = (id: string) => {
    setSavedPieces(prev => prev.filter(piece => piece.id !== id))
  }

  return (
    <div className="space-y-6">
      <StoneGenerator 
        onSavePiece={handleSavePiece}
        onRemovePiece={handleRemovePiece}
        savedPieces={savedPieces}
      />
      <MultiPieceExport savedPieces={savedPieces} />
    </div>
  )
}
