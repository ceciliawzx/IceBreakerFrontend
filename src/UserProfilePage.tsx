import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

/* Macro and Type */
import { serverPort } from "./macro/MacroServer";
import { UserProfile } from "./type/UserProfile";
import { User } from "./type/User";

/* Web socket */
import { connect, socketUrl, websocketUrl } from "./utils/WebSocketService";

/* CSS */
import "./css/UserProfilePage.css";

const UserProfilePage = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /* Location passed field */
  const user = location.state?.user;
  const userID = user.userID;
  const roomCode = user.roomCode;
  const displayName = user.displayName;

  /* Users in room */
  const [admin, setAdmin] = useState<User | null>(null);
  const [presenter, setPresenter] = useState<User | null>(null);

  /* User Information */
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [feeling, setFeeling] = useState("");
  const [favFood, setFavFood] = useState("");
  const [favActivity, setfavActivity] = useState("");
  const [selfieBase64, setSelfieBase64] = useState("");

  /* Camera related */
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCameraPopup, setShowCameraPopup] = useState(false);
  const [imageCaptured, setImageCaptured] = useState(false);
  const [image, setImage] = useState("");

  /* Popup */
  const [errorMessage, setErrorMessage] = useState("");
  const [showKickPopup, setShowKickPopup] = useState(false);
  const [showRingPopUp, setShowRingPopUp] = useState(false);
  const [showDismissPopup, setShowDismissPopup] = useState(false);

  /* UI render */
  const [render, setRender] = useState(false);

  /* -------- Use Effect ---------- */

  /* Initial pull */
  useEffect(() => {
    checkPlayers();
    checkKickOut();
    checkRing();
  }, []);

  /* When mount, connect websokect */
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

  /* When user pulled, collect previous input data */
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

  /* -------- Refresh Management ---------- */
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
          changePresenterAfterQuitting(admin!.userID);
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

  /* -------- Web Socket ---------- */

  /* When receive web socket message, check all status */
  const onMessageReceived = () => {
    checkPlayers();
    checkKickOut();
    checkRing();
  };

  /* -------- Button Handler ---------- */

  /* When click TakePicture button, open camera */
  const handleStartCamera = () => {
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

  /* When click Cancel/Confirm button, close camera */
  const handleCloseCamera = () => {
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

  /* When click Capture button, capture image */
  const handleCaptureImage = () => {
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

  /* When click UploadSelfie button, capture image */
  const handleSelfieChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const base64String = (await convertToBase64(file)) as string;
      setSelfieBase64(base64String);
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
      setErrorMessage(msg);
      console.log(msg);

      navigate("/WaitRoomPage", {
        state: { user },
      });
    } catch (error) {
      console.error("Error updating person:", error);
    }
  };

  /* When click Response button for Ring popup */
  const handleReceiveNotification = async () => {
    setShowRingPopUp(false);
  };

  /* -------- Check status ---------- */

  /* Fetch all player information and room status */
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

  /* Check if the user is ringed by admin */
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

  /* Check if the user is kicked out by admin */
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

  /* -------- Helper function ---------- */

  /* Filter special characters in input */
  const filterInput = (input: any) => {
    return input.trim().replace(/[^a-zA-Z0-9\s]/g, "");
  };

  /* Convert image into Base64 String */
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

  /* If current presenter exit room, change presenter back to admin  */
  const changePresenterAfterQuitting = async (userID: string) => {
    const response = await fetch(
      `${serverPort}/changePresenter?roomCode=${roomCode}&userID=${userID}`,
      {
        method: "POST",
      }
    );

    setShowRingPopUp(false);
  };

  /* -------- UI Component ---------- */

  /* Main renderer */
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
            onClick={handleStartCamera}
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
      {errorMessage && <p className="error-message">{errorMessage}</p>}

      {/* Camera popup */}
      {showCameraPopup && (
        <div className="camera-popup">
          <div className="column-container">
            <video ref={videoRef} width="400" height="300" />
            <div className="row-container">
              <button
                className="button common-button"
                onClick={handleCaptureImage}
              >
                {imageCaptured ? "Recapture Image" : "Capture Image"}
              </button>
              <button
                className="button common-button"
                onClick={handleCloseCamera}
              >
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

      {/* Kickout popup */}
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

      {/* Dismiss popup */}
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
