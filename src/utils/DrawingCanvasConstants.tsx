export interface DrawingMessage {
  roomCode: number;
  drawingData: {
    x: number;
    y: number;
    drawing: boolean; // true if drawing (mouse down), false if not (mouse up)
    isNewLine: boolean;
    color?: string; // Optional color of the stroke
    strokeWidth?: number; // Optional stroke width
  };
  timestamp: string;
  drawer: string;
}

export interface DrawingCanvasProps {
  onDraw: (drawingData: { x: number; y: number; drawing: boolean; isNewLine: boolean }) => void;
  externalDrawing: DrawingMessage | undefined;
  isDrawer: boolean;
}
