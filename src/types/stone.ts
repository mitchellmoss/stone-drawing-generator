export interface StoneSpecifications {
  width: number;
  height: number;
  polishedEdges: string[];
  materialType: string;
  thickness: string;
  quantity: number;
}

export interface MockupOptions {
  showGrid: boolean;
  showPolishedEdges: boolean;
  useXMarks: boolean;
  scale: number;
}

export interface StonePiece {
  id: string;
  specs: StoneSpecifications;
  notes: string; // Added notes field for storing additional information about the piece
}

export interface StoneProject {
  name: string;
  pieces: StonePiece[];
}
