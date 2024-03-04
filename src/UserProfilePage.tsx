import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { UserProfile } from "./type/UserProfile";
import { serverPort } from "./macro/MacroServer";
import {
  connect,
  sendMsg,
  socketUrl,
  websocketUrl,
} from "./utils/WebSocketService";
import "./css/UserProfilePage.css";
import { User } from "./type/User";

const UserProfilePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const userID = user.userID;

  const [admin, setAdmin] = useState<User | null>(null);
  const [presenter, setPresenter] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

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
  const [imageCaptured, setImageCaptured] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState("");
  const [showKickPopup, setShowKickPopup] = useState(false);
  const [showRingPopUp, setShowRingPopUp] = useState(false);
  const [showDismissPopup, setShowDismissPopup] = useState(false);
  const [render, setRender] = useState(false);

  // Initial pull
  useEffect(() => {
    checkPlayers();
    checkKickOut();
    checkRing();
  }, []);

  const onMessageReceived = () => {
    checkPlayers();
    checkKickOut();
    checkRing();
  };

  // Connect to presentRoom websokect
  useEffect(() => {
    const topic = `/topic/room/${roomCode}/wait`;
    const cleanup = connect(
      socketUrl,
      websocketUrl,
      topic,
      onMessageReceived,
      setRender
    );
    return cleanup;
  }, []);

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

  useEffect(() => {
    const notifyServerOnUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";

      const confirmationMessage = "Are you sure you want to leave?";
      event.returnValue = confirmationMessage;
      return confirmationMessage;
    };

    window.addEventListener("beforeunload", notifyServerOnUnload);

    return () => {
      window.removeEventListener("beforeunload", notifyServerOnUnload);
    };
  }, []);

  useEffect(() => {
    const notifyServerOnUnload = () => {
      handleKickUser(userID);
    };

    window.addEventListener("unload", notifyServerOnUnload);

    return () => {
      window.removeEventListener("unload", notifyServerOnUnload);
    };
  }, []);

  useEffect(() => {
    if (admin?.userID && presenter?.userID) {
      if (presenter.userID === userID) {
        const notifyServerOnUnload = () => {
          handleChangePresenterAfterQuitting(admin!.userID);
        };

        window.addEventListener("unload", notifyServerOnUnload);

        return () => {
          window.removeEventListener("unload", notifyServerOnUnload);
        };
      }
    }
  }, [admin, presenter]);

  useEffect(() => {
    if (admin?.userID) {
      if (admin.userID === userID) {
        const notifyServerOnUnload = () => {
          handleLeaveRoom();
        };

        window.addEventListener("unload", notifyServerOnUnload);

        return () => {
          window.removeEventListener("unload", notifyServerOnUnload);
        };
      }
    }
  }, [admin]);

  const handleLeaveRoom = async () => {
    // If admin leaves, send http request to delete room and all user should be kicked out
    const response = await fetch(
      `${serverPort}/destroyRoom?roomCode=${roomCode}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  };

  const handleChangePresenterAfterQuitting = async (userID: string) => {
    const response = await fetch(
      `${serverPort}/changePresenter?roomCode=${roomCode}&userID=${userID}`,
      {
        method: "POST",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  };

  const handleKickUser = async (userID: string) => {
    // kick this user
    const response = await fetch(
      `${serverPort}/kickPerson?roomCode=${roomCode}&userID=${userID}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  };

  const checkPlayers = async () => {
    const url = `${serverPort}/getPlayers?roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }

      const data = await response.json();

      // Check if room dismissed
      Object.values(data).some((value) => {
        if (typeof value === "string" && value.includes("Room Not Found")) {
          setShowDismissPopup(true);
          return;
        }
      });

      if (data.admin) {
        setAdmin(data.admin);
      }
      if (data.presenter) {
        setPresenter(data.presenter);
      }
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  const startCamera = () => {
    setShowCameraPopup(true);
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        streamRef.current = stream;
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
      const context = canvas.getContext("2d");
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = canvas.toDataURL("image/png");
        setImage(imageData); // This is the image in base64 format
        setSelfieBase64(imageData);
        setImageCaptured(true);
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

  const checkRing = async () => {
    const url = `${serverPort}/isNotified?userID=${userID}&roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }
      if (data) {
        console.log("Notification received!");
        setShowRingPopUp(true);
      }
    } catch (error) {
      console.error("Error fetching ring:", error);
    }
  };

  const checkKickOut = async () => {
    const url = `${serverPort}/getPlayer?userID=${userID}&roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }
      if (data.error === "Person Not Found") {
        setShowKickPopup(true);
      }
    } catch (error) {
      console.error("Error fetching player:", error);
    }
  };

  const handleSubmit = async () => {
    const userProfile = new UserProfile(
      user.displayName,
      user.roomCode,
      user.userID,
      selfieBase64,
      firstName.trim(),
      lastName.trim(),
      country.trim(),
      city.trim(),
      feeling.trim(),
      favFood.trim(),
      favActivity.trim()
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

  const handleReceiveNotification = async () => {
    const response = await fetch(
      `${serverPort}/acknowledgeNotification?roomCode=${roomCode}&userID=${userID}`,
      {
        method: "POST",
      }
    );

    setShowRingPopUp(false);
  };

  const filterInput = (input: any) => {
    return input.replace(/[^a-zA-Z0-9\s]/g, "");
  };

  return render ? (
    <div className="center-page">
      <h2>Hi {displayName},please enter your details</h2>
      <form className="column-container">
        <div className="row-container">
          <label>
            <span className="mandatory">*</span>First Name:
          </label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(filterInput(e.target.value))}
          />
        </div>
        <div className="row-container">
          <label>
            <span className="mandatory">*</span>Last Name:
          </label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(filterInput(e.target.value))}
          />
        </div>
        <div className="row-container">
          <label>
            <span className="mandatory">*</span>City:
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(filterInput(e.target.value))}
          />
        </div>
        <div className="row-container">
          <label>
            <span className="mandatory">*</span>Country:
          </label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(filterInput(e.target.value))}
          />
        </div>
        <div className="row-container">
          <label>
            <span className="mandatory">*</span>Current Feeling:
          </label>
          <input
            type="text"
            value={feeling}
            onChange={(e) => setFeeling(filterInput(e.target.value))}
          />
        </div>
        <div className="row-container">
          <label>
            <span className="mandatory">*</span>Favourite food:
          </label>
          <input
            type="text"
            value={favFood}
            onChange={(e) => setFavFood(filterInput(e.target.value))}
          />
        </div>
        <div className="row-container">
          <label>
            <span className="mandatory">*</span>Favourite activity:
          </label>
          <input
            type="text"
            value={favActivity}
            onChange={(e) => setfavActivity(filterInput(e.target.value))}
          />
        </div>
        <div className="row-container">
          <label>Selfie:</label>
          <input type="file" onChange={handleSelfieChange} accept="image/*" />
          <button
            type="button"
            className="button common-button"
            onClick={startCamera}
          >
            Take a Picture
          </button>
        </div>
        <div className="row-container">
          <label>Selfie Preview:</label>
          <div className="selfie-preview-container">
            {selfieBase64 && (
              <img
                src={selfieBase64}
                alt="Selfie preview"
                className="selfie-preview"
              />
            )}
          </div>
        </div>
      </form>
      <button
        type="submit"
        className="button common-button"
        onClick={handleSubmit}
        disabled={
          !(
            firstName &&
            lastName &&
            country &&
            city &&
            feeling &&
            favFood &&
            favActivity
          )
        }
      >
        Submit
      </button>
      {message && <p className="message">{message}</p>}

      {showCameraPopup && (
        <div className="camera-popup">
          <div className="column-container">
            <video ref={videoRef} width="400" height="300" />
            <div className="row-container">
              <button className="button common-button" onClick={captureImage}>
                {imageCaptured ? "Recapture Image" : "Capture Image"}
              </button>
              <button className="button common-button" onClick={closeCamera}>
                {imageCaptured ? "Confirm" : "Cancel"}
              </button>
            </div>
            <strong>Preview:</strong>
            <canvas
              ref={canvasRef}
              width="400"
              height="300"
              style={{ display: "none" }}
            />
            {image && <img src={image} alt="Captured" />}
          </div>
        </div>
      )}

      {/* kickout popup */}
      {showKickPopup && (
        <div className="overlay-popup">
          <div className="popup">
            <p>
              You are kicked out by moderator.
              <br />
              Returning to homepage.
            </p>
            <button
              className="button common-button"
              onClick={() => navigate("/")}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Ring popup */}
      {showRingPopUp && (
        <div className="overlay-popup">
          <div className="popup">
            <p>Please wrap it up.</p>
            <button
              className="button common-button"
              onClick={() => handleReceiveNotification()}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {showDismissPopup && (
        <div className="overlay-popup">
          <div className="popup">
            <p>
              Room {roomCode} dismissed by moderator.
              <br />
              Returning to homepage.
            </p>
            <button
              className="button common-button"
              onClick={() => navigate("/")}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  ) : (
    <></>
  );
};

export default UserProfilePage;
