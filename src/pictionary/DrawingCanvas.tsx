import React, { useCallback, useRef, useEffect, useState } from "react";
import {
  DrawingCanvasProps,
  DrawingData,
  presetColors,
  canvasBackgroundColor,
} from "../type/DrawingCanvas";
import "../css/DrawingCanvas.css";

const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  onDraw,
  onPaste,
  externalDrawing,
  externalPasteImg,
  isDrawer,
  target,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef<boolean>(false);
  const [isEraser, setIsEraser] = useState<boolean>(false); // New state for eraser
  const [selectedColor, setSelectedColor] = useState<string>("black"); // Default color
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
    window.addEventListener("resize", setCanvasSize);

    return () => {
      window.removeEventListener("resize", setCanvasSize);
    };
  }, []);

  // When receive drawingMessage from the server, draw it on the canvs
  useEffect(() => {
    if (externalDrawing?.drawingData) {
      if (externalDrawing.drawingData.clear) {
        // Clear the canvas
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        draw(externalDrawing.drawingData);
      }
    }
  }, [externalDrawing, externalDrawing?.drawingData]);

  // When receives paste image from the server, draw it on the canvas
  useEffect(() => {
    if (externalPasteImg?.pasteImgData?.imgUrl) {
      const img = new Image();
      img.onload = function () {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        // TODO
        ctx.drawImage(img, 0, 0);
      };
      img.src = externalPasteImg.pasteImgData.imgUrl;
    }
  }, [externalPasteImg, externalPasteImg?.pasteImgData]);

  useEffect(() => {
    const handlePaste = async (event: any) => {
      if (!isDrawer) return;

      const items = event.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") === 0) {
            const file = items[i].getAsFile();

            compressImage(file, async (blob: any) => {
              const formData = new FormData();
              formData.append("image", blob);

              try {
                const uploadResponse = await fetch(
                  "https://api.imgur.com/3/image",
                  {
                    method: "POST",
                    headers: {
                      Authorization: "Client-ID 8ee4fb7a4c2f78c",
                    },
                    body: formData,
                  }
                );
                const uploadResult = await uploadResponse.json();

                if (uploadResult.success) {
                  const imageUrl = uploadResult.data.link;
                  onPaste({ imgUrl: imageUrl });
                } else {
                  console.error("Imgur upload failed:", uploadResult);
                }
              } catch (error) {
                console.error("Error uploading image to Imgur:", error);
              }
            });
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);

    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [isDrawer, onPaste]);

  const draw = useCallback(
    (drawingData: DrawingData) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
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
      clear: false,
    };
    console.log("ondraw in mouse move", drawingData);
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
      clear: false,
    };

    // draw(drawingData);
    onDraw(drawingData);
    console.log("ondraw in mouse down", drawingData);
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
      clear: false,
    };

    draw(drawingData); // End the current path
  };

  const handleMouseLeave = (event: MouseEvent) => {
    if (!isDrawer || !isDrawing.current) return;

    isDrawing.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Capture the last trace within the canvas before stopping
    const drawingData: DrawingData = {
      x,
      y,
      drawing: false,
      newLine: false,
      color: isEraser ? backgroundColor : selectedColor,
      strokeWidth: isEraser ? 20 : 2,
      eraser: isEraser,
      clear: false,
    };
    // Optionally send the last part of the trace to the server here
    onDraw(drawingData);
  };

  const handleClearCanvas = () => {
    const drawingData: DrawingData = {
      x: 0,
      y: 0,
      drawing: false,
      newLine: false,
      color: backgroundColor,
      strokeWidth: 0,
      eraser: isEraser,
      clear: true,
    };
    onDraw(drawingData);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.addEventListener("mousedown", handleMouseDown);
    canvas.addEventListener("mouseup", handleMouseUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown);
      canvas.removeEventListener("mouseup", handleMouseUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [handleMouseDown, handleMouseUp, handleMouseMove, handleMouseLeave]);

  // Change cursor
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isEraser) {
      canvas.classList.add("eraser-cursor");
    } else {
      canvas.classList.remove("eraser-cursor");
    }
  }, [isEraser]);

  const compressImage = (file: Blob, callback: (blob: Blob | null) => void) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width; // Keep original dimensions
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, img.width, img.height);

        // Adjust the quality to reduce file size
        // Lower the quality for smaller size
        canvas.toBlob((blob) => callback(blob), "image/jpeg", 0.7); 
      };
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.readAsDataURL(file);
  };

  // Placeholder for non-drawer users to maintain layout consistency
  const Placeholder = () => <div style={{ height: "51px" }}></div>;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignContent: "center",
      }}
    >
      {isDrawer ? (
        <div id="color-selector">
          {presetColors.map((color) => (
            <button
              className="color-selector-button"
              key={color}
              style={{ backgroundColor: color }}
              onClick={() => {
                setSelectedColor(color);
                setIsEraser(false);
              }}
            />
          ))}
          <button
            className="button common-button"
            id="eraser"
            onClick={() => setIsEraser(!isEraser)}
          >
            {isEraser ? "Use Pen" : "Use Eraser"}
          </button>
          <button
            className="button common-button"
            id="clear-canvas"
            onClick={handleClearCanvas}
          >
            Clear Canvas
          </button>
        </div>
      ) : (
        <Placeholder />
      )}
      <div style={{ position: "relative" }}>
        <div className="word-display">{target}</div>
        <canvas
          id="drawing-canvas"
          ref={canvasRef}
          style={{ width: "100%", height: "auto" }}
        />
      </div>
    </div>
  );
};

export default DrawingCanvas;
