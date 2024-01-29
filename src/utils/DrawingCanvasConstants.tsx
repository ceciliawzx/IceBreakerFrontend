export interface DrawingData {
  x: number;
  y: number;
  drawing: boolean;
  newLine: boolean;
  color: string;
  strokeWidth: number;
}

export interface DrawingMessage {
  roomCode: number;
  drawingData: DrawingData;
  timestamp: string;
  drawer: string;
}

export interface DrawingCanvasProps {
  onDraw: (drawingData: DrawingData ) => void;
  externalDrawing: DrawingMessage | undefined;
  isDrawer: boolean;
}
