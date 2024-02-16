import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "./type/UserProfile";
import { serverPort } from "./macro/MacroServer";
import "./css/UserProfilePage.css";

const UserProfilePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const preID = location.state?.preID;
  const roomCode = user.roomCode;
  const displayName = user.displayName;
  const [message, setMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [feeling, setFeeling] = useState("");
  const [favFood, setFavFood] = useState("");
  const [favActivity, setfavActivity] = useState("");
  const [selfieBase64, setSelfieBase64] = useState("");
  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState('');

  const startCamera = () => {
    setShowCameraPopup(true);
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(stream => {
        streamRef.current = stream;
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

  const closeCamera = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null; // Clear the reference
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null; // Detach the stream from the video element
    }
    setShowCameraPopup(false);
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
        setSelfieBase64(imageData);
      }
    }
  };
  

  const handleSelfieChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const base64String = (await convertToBase64(file)) as string;
      setSelfieBase64(base64String);
    }
  };

  const convertToBase64 = (file: File) => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.readAsDataURL(file);
      fileReader.onload = () => {
        resolve(fileReader.result);
      };
      fileReader.onerror = (error) => {
        reject(error);
      };
    });
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(
          `${serverPort}/getPlayer?userID=${user.userID}&roomCode=${user.roomCode}`
        );
        if (!response.ok) {
          throw new Error("Person Not Found");
        }
        const data = await response.json();

        if (data && data.userInfo) {
          setFirstName(data.userInfo.firstName || "");
          setLastName(data.userInfo.lastName || "");
          setCity(data.userInfo.city || "");
          setCountry(data.userInfo.country || "");
          setFeeling(data.userInfo.feeling || "");
          setFavFood(data.userInfo.favFood || "");
          setfavActivity(data.userInfo.favActivity || "");
          setSelfieBase64(data.userInfo.profileImage || "");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user.userID, user.roomCode]);

  const handleSubmit = async () => {
    const userProfile = new UserProfile(
      user.displayName,
      user.roomCode,
      user.userID,
      selfieBase64,
      firstName,
      lastName,
      country,
      city,
      feeling,
      favFood,
      favActivity
    );

    try {
      const response = await fetch(`${serverPort}/updatePerson`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userProfile),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`); // Error message
      }
      const msg = await response.text();
      setMessage(msg);
      console.log(msg);

      navigate("/WaitRoomPage", {
        state: { user },
      });
    } catch (error) {
      console.error("Error updating person:", error);
    }
  };

  return (
    <div className="center-page">
      <h2>Hi {displayName},please enter your details</h2>
      <form className="column-container">
        <div className="row-container">
        <label><span className="mandatory">*</span>First Name:</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="row-container">
          <label><span className="mandatory">*</span>Last Name:</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div className="row-container">
          <label><span className="mandatory">*</span>City:</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div className="row-container">
          <label><span className="mandatory">*</span>Country:</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
        <div className="row-container">
          <label><span className="mandatory">*</span>Current Feeling:</label>
          <input
            type="text"
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
          />
        </div>
        <div className="row-container">
          <label><span className="mandatory">*</span>Favourite food:</label>
          <input
            type="text"
            value={favFood}
            onChange={(e) => setFavFood(e.target.value)}
          />
        </div>
        <div className="row-container">
          <label><span className="mandatory">*</span>Favourite activity:</label>
          <input
            type="text"
            value={favActivity}
            onChange={(e) => setfavActivity(e.target.value)}
          />
        </div>
        <div className="row-container">
          <label>Selfie:</label>
          <input type="file" onChange={handleSelfieChange} accept="image/*" />
          <button type="button" className="button common-button" onClick={startCamera}>Take a Picture</button>
        </div>
        <div className="row-container">
          <label>Selfie Preview:</label>
          <div className="selfie-preview-container">
            {selfieBase64 && <img src={selfieBase64} alt="Selfie preview" className="selfie-preview" />}
          </div>
        </div>
      </form>
      <button type="submit" className="button common-button" onClick={handleSubmit}>
        Submit
      </button>
      {message && <p className="message">{message}</p>}

      {showCameraPopup && (
        <div className="camera-popup">
          <div className="column-container">
            <video ref={videoRef} width="640" height="480" />
            <div className="row-container">
              <button className="button common-button" onClick={closeCamera}>Close Camera</button>
              <button className="button common-button" onClick={captureImage}>Capture Image</button>
            </div>
            <canvas ref={canvasRef} width="640" height="480" style={{ display: 'none' }} />
            {image && <img src={image} alt="Captured" />}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfilePage;
