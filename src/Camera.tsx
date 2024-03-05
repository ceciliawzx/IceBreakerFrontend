import React, { useRef, useState } from "react";

const CameraCapture = () => {
  /* Camera related*/
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState("");

  /* Start camera */
  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play();
        }
      })
      .catch((err) => {
        console.error("error accessing the camera", err);
      });
  };

  /* Capture Image */
  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/png");
        setImage(imageData); // This is the image in base64 format
      }
    }
  };

  /* -------- UI Component ---------- */

  /* Main renderer */
  return (
    <div>
      <video ref={videoRef} width="640" height="480" />
      <button className="button common-button" onClick={startVideo}>
        Start Camera
      </button>
      <button className="button common-button" onClick={captureImage}>
        Capture Image
      </button>
      <canvas
        ref={canvasRef}
        width="640"
        height="480"
        style={{ display: "none" }}
      />
      {image && <img src={image} alt="Captured" />}
    </div>
  );
};

export default CameraCapture;
