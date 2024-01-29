import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./css/UserProfilePage.css";
import { UserProfile } from "./type/UserProfile";
import { serverPort } from "./macro/MacroServer";

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

      // refresh presenter information
      fetch(
        `${serverPort}/changePresenter?roomCode=${roomCode}&userID=${preID}`,
        {
          method: "POST",
        }
      );

      navigate("/WaitRoomPage", {
        state: { user },
      });
    } catch (error) {
      console.error("Error updating person:", error);
    }
  };

  return (
    <div className="user-profile-container">
      <h2 className="form-title">Hi {displayName},please enter your details</h2>
      <form className="form">
        <div className="form-row">
          <label>First Name:</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>Last Name:</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>City:</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>Country:</label>
          <input
            type="text"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>Current Feeling:</label>
          <input
            type="text"
            value={feeling}
            onChange={(e) => setFeeling(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>Favourite food:</label>
          <input
            type="text"
            value={favFood}
            onChange={(e) => setFavFood(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>Favourite activity:</label>
          <input
            type="text"
            value={favActivity}
            onChange={(e) => setfavActivity(e.target.value)}
          />
        </div>
        <div className="form-row">
          <label>Selfie:</label>
          <input type="file" onChange={handleSelfieChange} accept="image/*" />
        </div>
      </form>
      <button type="submit" className="submit-button" onClick={handleSubmit}>
        Submit
      </button>
      {message && <p className="message">{message}</p>}
    </div>
  );
};

export default UserProfilePage;
