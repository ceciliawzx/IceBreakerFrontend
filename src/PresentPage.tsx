import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import { serverPort } from "./macro/MacroServer";

import "./css/PresentPage.css";

const PresentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const userID = user.userID;
  const roomCode = user.roomCode;
  const presenter = location.state?.presenter;
  const [revealInfo, setRevealInfo] = useState({
    firstName: false,
    lastName: false,
  });
  const [fetchedFirstName, setFetchedFirstName] = useState("");
  type RevealInfo = {
    firstName: boolean;
    lastName: boolean;
  };

  const fetchUserDataField = async (field: keyof RevealInfo) => {
    try {
      const response = await fetch(
        `${serverPort}/getPlayer?userID=${presenter.userID}&roomCode=${user.roomCode}`
      );
      if (!response.ok) {
        throw new Error("Error fetching data");
      }
      const data = await response.json();
      if (field === "firstName") {
        setFetchedFirstName(data.userInfo.firstName);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const handleToggleReveal = (field: keyof RevealInfo) => {
    if (!revealInfo[field]) {
      fetchUserDataField(field);
    }
    setRevealInfo((prev) => ({ ...prev, [field]: true }));
  };

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
          First Name:{" "}
          <span onClick={() => handleToggleReveal("firstName")}>
            {revealInfo.firstName ? fetchedFirstName : "Click to reveal"}
          </span>
        </p>
        {/* Handle other fields similarly */}
      </div>
    </div>
  );
};

export default PresentPage;
