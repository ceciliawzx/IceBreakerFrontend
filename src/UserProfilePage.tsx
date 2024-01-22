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
  const [selfie, setSelfie] = useState<File | null>(null);

  const handleSelfieChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelfie(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    const userProfile = new UserProfile(
      user,
      firstName,
      lastName,
      country,
      city,
      "1", // Add an empty string for the 'feeling' argument
      "1", // Add an empty string for the 'favFood' argument
      "1", // Add an empty string for the 'favActivity' argument
      "1" // Add an empty string for the 'profileImage' argument
    );

    try {
      const response = await fetch(`${serverPort}/updatePerson`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userProfile)
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
