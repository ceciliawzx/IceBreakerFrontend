import React, { useState } from "react";
import "./UserProfilePage.css";

const UserProfilePage = () => {
  const [displayName, setDisplayName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [message, setMessage] = useState("");
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

  const handleSubmit = () => {
    const userData = {
      firstName: firstName,
      lastName: lastName,
      city: city,
      country: country,
      selfie: selfie,
    };
    const userDataJSON = JSON.stringify(userData);
    const apiUrl = "https://example.com/api/user";

    // Send the JSON data to the backend using the fetch API
    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: userDataJSON,
    })
      .then((response) => response.json())
      .then((data) => {
        // Handle the response from the backend
        console.log("Response:", data);
      })
      .catch((error) => {
        // Handle errors
        console.error("Error:", error);
      });
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
    </div>
  );
};

export default UserProfilePage;
