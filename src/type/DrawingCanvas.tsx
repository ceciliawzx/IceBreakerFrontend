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
  roomCode: string;
  drawingData: DrawingData;
  timestamp: string;
  drawer: string;
}

export interface PasteImgData {
  imgUrl: string;
}

export interface PasteImgMessage {
  roomCode: string;
  pasteImgData: PasteImgData;
  timestamp: string;
  paster: string;
}

export interface DrawingCanvasProps {
  onDraw: (drawingData: DrawingData) => void;
  onPaste: (pasteImg: PasteImgData) => void;
  externalDrawing: DrawingMessage | undefined;
  externalPasteImg: PasteImgMessage | undefined;
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
