import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  DrawingCanvasProps,
  DrawingData,
  presetColors,
  canvasBackgroundColor,
} from '../type/DrawingCanvas';
import '../css/DrawingCanvas.css';

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onDraw,
  externalDrawing,
  isDrawer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef<boolean>(false);
  const [isEraser, setIsEraser] = useState<boolean>(false); // New state for eraser
  const [selectedColor, setSelectedColor] = useState<string>('black'); // Default color
  const backgroundColor = canvasBackgroundColor; // Canvas background color

  // Set responsive canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const setCanvasSize = () => {
      // set some margin
      canvas.width = window.innerWidth * 0.75;
      canvas.height = window.innerHeight * 0.91;
    };

    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    return () => {
      window.removeEventListener('resize', setCanvasSize);
    };
  }, []);

  const draw = useCallback(
    (drawingData: DrawingData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y, drawing, newLine, color, strokeWidth, eraser } =
        drawingData;
      ctx.strokeStyle = eraser ? backgroundColor : color; // Use background color if eraser is active
      ctx.lineWidth = strokeWidth; // Set the line width

      if (newLine) {
        ctx.beginPath(); // Start a new path
        ctx.moveTo(x, y);
      } else if (drawing) {
        ctx.lineTo(x, y);
        ctx.stroke();
      } else {
        ctx.stroke();
      }
    },
    [[backgroundColor]]
  );

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDrawer) return;

    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const drawingData: DrawingData = {
      x,
      y,
      drawing: true,
      newLine: false,
      color: isEraser ? backgroundColor : selectedColor, // Use background color if eraser is active
      strokeWidth: isEraser ? 20 : 2,
      eraser: isEraser,
    };
    console.log('ondraw in mouse move', drawingData);
    // send msg to server
    onDraw(drawingData);
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (!isDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = true;

    const rect = canvas.getBoundingClientRect();
    // Calculate the coordinates of the new trace
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const drawingData: DrawingData = {
      x,
      y,
      drawing: false,
      newLine: true,
      color: isEraser ? backgroundColor : selectedColor, // Use background color if eraser is active
      // TODO
      strokeWidth: isEraser ? 20 : 2,
      eraser: isEraser,
    };

    // draw(drawingData);
    onDraw(drawingData);
    console.log('ondraw in mouse down', drawingData);
  };

  const handleMouseUp = (event: MouseEvent) => {
    if (!isDrawer) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    isDrawing.current = false;

    const rect = canvas.getBoundingClientRect();
    // Calculate the coordinates of the new trace
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const drawingData: DrawingData = {
      x,
      y,
      drawing: false,
      newLine: false,
      color: isEraser ? backgroundColor : selectedColor, // Use background color if eraser is active
      strokeWidth: isEraser ? 20 : 2,
      eraser: isEraser,
    };

    draw(drawingData); // End the current path
  };

  useEffect(() => {
    if (externalDrawing) {
      console.log('external', externalDrawing.drawingData);
      // const { x, y, drawing, newLine } = externalDrawing.drawingData;
      draw(externalDrawing.drawingData);
    }
  }, [externalDrawing]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseDown, handleMouseUp, handleMouseMove]);

  // Change cursor
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isEraser) {
      canvas.classList.add('eraser-cursor');
    } else {
      canvas.classList.remove('eraser-cursor');
    }
  }, [isEraser]);

  // Placeholder for non-drawer users to maintain layout consistency
  const Placeholder = () => <div style={{ height: '51px' }}></div>;

  return (
    <div>
      {isDrawer ? (
        <div id='color-selector'>
          {presetColors.map((color) => (
            <button
              className='color-selector-button'
              key={color}
              style={{ backgroundColor: color }}
              onClick={() => {
                setSelectedColor(color);
                setIsEraser(false);
              }}
            />
          ))}
          <button id='eraser' onClick={() => setIsEraser(!isEraser)}>
            {isEraser ? 'Use Pen' : 'Use Eraser'}
          </button>
        </div>
      ) : (
        <Placeholder />
      )}
      <canvas id='drawing-canvas' ref={canvasRef}/>
    </div>
  );
};

export default DrawingCanvas;
