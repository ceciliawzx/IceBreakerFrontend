import React, { useCallback, useRef, useEffect } from 'react';
import { DrawingCanvasProps } from '../utils/DrawingCanvasConstants';

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onDraw,
  externalDrawing,
  isDrawer,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef<boolean>(false);

  const draw = useCallback((x: number, y: number, isDown: boolean) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) return;

    if (isDown) {
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
      ctx.stroke();
    }
  }, []);

  const handleMouseMove = (event: MouseEvent) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (isDrawer) {
      draw(x, y, false);
      onDraw({ x, y, drawing: false });
    }
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (!isDrawer) return; // Only allow drawing when isDrawer is true

    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    draw(x, y, true);
    onDraw({ x, y, drawing: true });
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
  };

  useEffect(() => {
    if (externalDrawing) {
      draw(
        externalDrawing.drawingData.x,
        externalDrawing.drawingData.y,
        externalDrawing.drawingData.drawing
      );
    }
  }, [externalDrawing, draw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.strokeStyle = 'black';

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mousemove', handleMouseMove);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [handleMouseDown, handleMouseUp, handleMouseMove]);

  return <canvas ref={canvasRef} width='800' height='600' color='gray' />;
};

export default DrawingCanvas;
