import React from 'react'

export interface PolishedEdgesInputProps {
  polishedEdges: string[];
  onPolishedEdgesChange: (edges: string[]) => void;
}

export function PolishedEdgesInput({ 
  polishedEdges, 
  onPolishedEdgesChange 
}: PolishedEdgesInputProps) {
  
  const toggleEdge = (edge: string) => {
    if (polishedEdges.includes(edge)) {
      onPolishedEdgesChange(polishedEdges.filter(e => e !== edge));
    } else {
      onPolishedEdgesChange([...polishedEdges, edge]);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-700">Polished Edges</h3>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <input
            id="top-edge"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={polishedEdges.includes('top')}
            onChange={() => toggleEdge('top')}
          />
          <label htmlFor="top-edge" className="ml-2 block text-sm text-gray-700">
            Top Edge (Long Side)
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            id="bottom-edge"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={polishedEdges.includes('bottom')}
            onChange={() => toggleEdge('bottom')}
          />
          <label htmlFor="bottom-edge" className="ml-2 block text-sm text-gray-700">
            Bottom Edge (Long Side)
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            id="left-edge"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={polishedEdges.includes('left')}
            onChange={() => toggleEdge('left')}
          />
          <label htmlFor="left-edge" className="ml-2 block text-sm text-gray-700">
            Left Edge (Short Side)
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            id="right-edge"
            type="checkbox"
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            checked={polishedEdges.includes('right')}
            onChange={() => toggleEdge('right')}
          />
          <label htmlFor="right-edge" className="ml-2 block text-sm text-gray-700">
            Right Edge (Short Side)
          </label>
        </div>
      </div>
    </div>
  )
}
