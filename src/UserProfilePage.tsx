import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import "./UserProfilePage.css";
import { UserProfile } from "./UserProfile";
import { serverPort } from "./MacroConst";

const UserProfilePage = () => {
  const [message, setMessage] = useState("");
  const location = useLocation();
  const user = location.state?.user;
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [base64, setBase64] = useState<string>("");

  const handleSelfieChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const base64String = (await convertToBase64(file)) as string;
      setBase64(base64String);
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

  const handleSubmit = async () => {
    console.log(base64);
    const userProfile = new UserProfile(
      user.displayName,
      user.roomCode,
      user.userID,
      base64,// Add an empty string for the 'profileImage' argument
      firstName,
      lastName,
      country,
      city,
      "1", // Add an empty string for the 'feeling' argument
      "1", // Add an empty string for the 'favFood' argument
      "1" // Add an empty string for the 'favActivity' argument
    );
    console.log(userProfile);
    try {
      const response = await fetch(`${serverPort}/updatePerson`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userProfile),
      });

      console.log(response);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`); // Error message
      }
      const msg = await response.text();
      setMessage(msg);
      console.log(msg);
    } catch (error) {
      console.error("Error updating person:", error);
    }
  };

  return (
    <div className="user-profile-container">
      <h2 className="form-title">Please enter your details</h2>
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
