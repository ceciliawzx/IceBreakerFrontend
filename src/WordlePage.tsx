import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./css/WordlePage.css";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import { serverPort } from "./macro/MacroServer";

const Wordle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = location.state?.user;
  const roomCode = user.roomCode;
  const isAdmin = user.isAdmin;
  const admin = location.state?.admin;
  const presenter = location.state?.presenter;
  const guests: User[] = location.state?.guests;

  const [selectedUserProfile, setSelectedUserProfile] =
    useState<UserProfile | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  const [currentGuesser, setCurrentGuesser] = useState<User>(guests[0]);
  const [targetWord, setTargetWord] = useState<string>("apple"); // Set your target word
  const [currentGuess, setCurrentGuess] = useState<string[]>([
    "",
    "",
    "",
    "",
    "",
  ]);
  const [attempts, setAttempts] = useState<number>(0);

  // Implement functions to handle user input and game logic
  const handleInputChange = (index: number, value: string) => {
    const updatedGuess = [...currentGuess];
    updatedGuess[index] = value.toUpperCase(); // You can convert to uppercase for consistency
    setCurrentGuess(updatedGuess);
  };

  const handleGuess = () => {
    // Implement logic to check the guess against the target word
    const fullGuess = currentGuess.join("");
    setAttempts(attempts + 1);
    if (fullGuess == targetWord) {
      console.log("Right!");
    }
    // Update other game state as needed
  };

  const handleBack = () => {
    navigate("/WaitRoomPage", {
      state: { user, admin, presenter, guests },
    });
  };

  const handleViewProfile = async (user: User | null) => {
    if (user) {
      const url = `${serverPort}/getPlayer?userID=${user.userID}&roomCode=${roomCode}`;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        console.log(data);

        setSelectedUserProfile(
          new UserProfile(
            data.userInfo.displayName,
            data.userInfo.roomCode,
            data.userInfo.userID,
            data.userInfo.profileImage,
            data.userInfo.firstName,
            data.userInfo.lastName,
            data.userInfo.country,
            data.userInfo.city,
            data.userInfo.feeling,
            data.userInfo.favFood,
            data.userInfo.favActivity
          )
        );

        setShowProfilePopup(true);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }
  };

  return (
    <div className="wordle-page">
      <h1>Welcome to Wordle, {user.displayName}!</h1>

      <div className="presenter">
        <h2>Presenter:</h2>
        <img
          src={`${presenter?.profileImage}`} // {admin.profileImage}
          alt="Presenter's Image"
          className="presenter-avatar"
        />
        <p>{presenter?.displayName}</p>
      </div>

      <p>Attempts: {attempts}</p>
      <div>
        {currentGuess.map((letter, index) => (
          <input
            key={index}
            type="text"
            maxLength={1}
            value={letter}
            onChange={(e) => handleInputChange(index, e.target.value)}
          />
        ))}
      </div>
      <button className="common-button" onClick={handleGuess}>
        Guess
      </button>

      <div className="guest-list">
        <h2>Joined Guests:</h2>
        <div className="guest-container">
          {guests.map((guest, index) => (
            <div key={index} className="guest">
              <div className="avatar-container">
                <img
                  src={`${guest.profileImage}`}
                  alt={`${guest}'s avatar`}
                  className="guest-avatar"
                />
                {guest.completed && (
                  <div className="input-status-indicator">✓</div>
                )}
              </div>
              <p>{guest.displayName}</p>
              {isAdmin && (
                <button
                  className="admin-only-button"
                  onClick={() => handleViewProfile(guest)}
                >
                  View Profile
                </button>
              )}
            </div>
          ))}
        </div>
        <div className="river"></div>
      </div>

      <button className="common-button" onClick={handleBack}>
        Back
      </button>
      {/* Display other game elements */}
    </div>
  );
};

export default Wordle;
