export interface DrawingData {
  x: number;
  y: number;
  drawing: boolean;
  newLine: boolean;
  color: string;
  strokeWidth: number;
  eraser: boolean;
  clear: boolean;
}

export interface DrawingMessage {
  roomCode: number;
  drawingData: DrawingData;
  timestamp: string;
  drawer: string;
}

export interface DrawingCanvasProps {
  onDraw: (drawingData: DrawingData) => void;
  externalDrawing: DrawingMessage | undefined;
  isDrawer: boolean;
  target: any;
}

// Preset colors for the canvas
export const presetColors = [
  "black",
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
];

export const canvasBackgroundColor = "rgb(248, 223, 194)";
