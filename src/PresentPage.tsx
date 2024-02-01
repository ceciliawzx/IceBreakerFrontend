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
    country: false,
    city: false
  });
  const [fetchedFirstName, setFetchedFirstName] = useState("");
  const [fetchedLastName, setFetchedLastName] = useState("");
  const [fetchedCountry, setFetchedCountry] = useState("");
  const [fetchedCity, setFetchedCity] = useState("");
  type RevealInfo = {
    firstName: boolean;
    lastName: boolean;
    country: boolean;
    city: boolean;
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
      if (field === "lastName") {
        setFetchedLastName(data.userInfo.lastName);
      }
      if (field === "country") {
        setFetchedCountry(data.userInfo.country);
      }
      if (field === "city") {
        setFetchedCity(data.userInfo.city);
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
        <p>
          Last Name:{" "}
          <span onClick={() => handleToggleReveal("lastName")}>
            {revealInfo.lastName ? fetchedLastName : "Click to reveal"}
          </span>
        </p>
        <p>
          City:{" "}
          <span onClick={() => handleToggleReveal("city")}>
            {revealInfo.city ? fetchedCity : "Click to reveal"}
          </span>
        </p>
        <p>
          Country:{" "}
          <span onClick={() => handleToggleReveal("country")}>
            {revealInfo.country ? fetchedCountry : "Click to reveal"}
          </span>
        </p>
      </div>
    </div>
  );
};

export default PresentPage;
