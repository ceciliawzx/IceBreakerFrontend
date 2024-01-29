import React, { useCallback, useRef, useEffect, useState } from 'react';
import {
  DrawingCanvasProps,
  DrawingData,
} from '../utils/DrawingCanvasConstants';

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onDraw,
  externalDrawing,
  isDrawer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef<boolean>(false);
  const [selectedColor, setSelectedColor] = useState<string>('black'); // Default color

  // Preset colors
  const colors = [
    'black',
    'red',
    'blue',
    'green',
    'yellow',
    'purple',
    'orange',
  ];

  const draw = useCallback((drawingData: DrawingData) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y, drawing, newLine, color } = drawingData;
    ctx.strokeStyle = color; // Use the provided color

    if (newLine) {
      ctx.beginPath(); // Start a new path
      ctx.moveTo(x, y);
    } else if (drawing) {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else {
      ctx.stroke();
    }
  }, []);

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
      color: selectedColor,
      strokeWidth: 2,
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
      color: selectedColor,
      strokeWidth: 2,
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
      color: selectedColor,
      strokeWidth: 2,
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

  return (
    <>
      <div>
        {colors.map((color) => (
          <button
            key={color}
            style={{
              backgroundColor: color,
              width: '25px',
              height: '25px',
              margin: '2px',
            }}
            onClick={() => setSelectedColor(color)} // Update color state on click
          />
        ))}
      </div>
      <canvas ref={canvasRef} width='800' height='600' />
    </>
  );
};

export default DrawingCanvas;
