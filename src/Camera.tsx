import React, { useRef, useState } from 'react';

const CameraCapture = () => {
  // Specify the correct types for the refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState('');

  const startVideo = () => {
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.play();
        }
      })
      .catch(err => {
        console.error("error accessing the camera", err);
      });
  };

  const captureImage = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL('image/png');
        setImage(imageData); // This is the image in base64 format
      }
    }
  };

  return (
    <div>
      <video ref={videoRef} width="640" height="480" />
      <button onClick={startVideo}>Start Camera</button>
      <button onClick={captureImage}>Capture Image</button>
      <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
      {image && <img src={image} alt="Captured" />}
    </div>
  );
};

export default CameraCapture;
