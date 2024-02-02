import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserProfile } from "./type/UserProfile";
import { serverPort } from "./macro/MacroServer";
import { PresentRoomInfo } from "./type/PresentRoomInfo";
import { refreshTime } from "./macro/MacroConst";

import "./css/PresentPage.css";
import { User } from "./type/User";

const PresentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user: UserProfile = location.state?.user;
  const userID: string = user.userID;
  const roomCode: string = user.roomCode;
  const presenter: UserProfile = location.state?.presenter;
  const admin: User = location.state?.admin;
  const [presenterInfo, setPresenterInfo] = useState<UserProfile | null>(null);
  const [presentRoomInfo, setPresentRoomInfo] = useState<PresentRoomInfo>({
    firstName: false,
    lastName: false,
    country: false,
    city: false,
    feeling: false,
    favFood: false,
    favActivity: false,
  });

  // fetch detailed information of presenter when entering the room
  useEffect(() => {
    fetchPresenterInfo();
  }, []);

  useEffect(() => {
    // Check what fields of presentRoomInfo are revealed every interval
    const intervalId = setInterval(() => {
      checkPresentRoomInfo();
    }, refreshTime);
    return () => clearInterval(intervalId);
    // Add other navigation conditions if needed
  }, [user, presenter]);

  const fetchPresenterInfo = async () => {
    const url = `${serverPort}/getPlayer?roomCode=${roomCode}&userID=${presenter.userID}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setPresenterInfo(data.userInfo);
    } catch (error) {
      console.error("Error fetching presenterInfo:", error);
    }
  };

  const checkPresentRoomInfo = async () => {
    const url = `${serverPort}/getPresentRoomInfo?roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setPresentRoomInfo(data.presentRoomInfo);
    } catch (error) {
      console.error("Error fetching presentRoomInfo:", error);
    }
  };

  const updatePresentRoomInfo = async (newPresentRoomInfo: PresentRoomInfo) => {
    const url = `${serverPort}/setPresentRoomInfo?roomCode=${roomCode}`;
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newPresentRoomInfo),
      });
      if (response) {
        // Re-fetch the updated state after a successful update
        checkPresentRoomInfo();
      }
    } catch (error) {
      console.error("Error setting presentRoomInfo in backend: ", error);
    }
  };

  const handleToggleReveal = (field: keyof PresentRoomInfo) => {
    const newPresentRoomInfo: PresentRoomInfo = {
      ...presentRoomInfo,
      [field]: true,
    };
    updatePresentRoomInfo(newPresentRoomInfo);
  };

  const handleBack = async () => {
    const url = `${serverPort}/backToWaitRoom?roomCode=${roomCode}`;
    try {
      const response = await fetch(url, {
        method: "POST"
      });
      if (response.ok) {
        navigate("/WaitRoomPage", {
          state: { user, admin },
        });
      }
    } catch (error) {
      console.error("Error returning to WaitRoom:", error);
    }
  }

  const revealDefaultInfo =
    presenter.userID === userID ? "Click to Reveal" : "********";

  return (
    <div className="present-page-container">
      <div className="presenter-container">
        <img
          src={presenter?.profileImage}
          alt={presenter?.displayName}
          className="presenter-avatar"
        />
        <h2>{presenter?.displayName}</h2>
      </div>

      <div className="presenter-info">
        <p>
          First Name:
          <span onClick={() => handleToggleReveal("firstName")}>
            {presentRoomInfo.firstName
              ? presenterInfo?.firstName
              : revealDefaultInfo}
          </span>
        </p>
        <p>
          Last Name:{" "}
          <span onClick={() => handleToggleReveal("lastName")}>
            {presentRoomInfo.lastName
              ? presenterInfo?.lastName
              : revealDefaultInfo}
          </span>
        </p>
        <p>
          City:{" "}
          <span onClick={() => handleToggleReveal("city")}>
            {presentRoomInfo.city ? presenterInfo?.city : revealDefaultInfo}
          </span>
        </p>
        <p>
          Country:{" "}
          <span onClick={() => handleToggleReveal("country")}>
            {presentRoomInfo.country
              ? presenterInfo?.country
              : revealDefaultInfo}
          </span>
        </p>
        <p>
          Felling:{" "}
          <span onClick={() => handleToggleReveal("feeling")}>
            {presentRoomInfo.feeling
              ? presenterInfo?.feeling
              : revealDefaultInfo}
          </span>
        </p>
        <p>
          Favorite Food:{" "}
          <span onClick={() => handleToggleReveal("favFood")}>
            {presentRoomInfo.favFood
              ? presenterInfo?.favFood
              : revealDefaultInfo}
          </span>
        </p>
        <p>
          Favorite Activity:{" "}
          <span onClick={() => handleToggleReveal("favActivity")}>
            {presentRoomInfo.favActivity
              ? presenterInfo?.favActivity
              : revealDefaultInfo}
          </span>
        </p>
      </div>
      <div>
        {userID === admin.userID && (
          <button
            className="admin-only-button"
            onClick={() => handleBack()}
          >
            Back
          </button>
        )}
      </div>
    </div>
  );
};

export default PresentPage;
