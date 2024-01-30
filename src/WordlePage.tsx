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

  // TODO: Need to fetch
  const totalAttempts = 6;
  const targetCharNum = 5;

  const [currentGuesser, setCurrentGuesser] = useState<User>(guests[0]);
  const [currentAttempt, setCurrentAttempt] = useState<number>(0);
  const [targetWord, setTargetWord] = useState<string>("APPLE"); // Set your target word

  // totalAttempts: rowNum; targeteCharNum: coluNum
  const [currentGuess, setCurrentGuess] = useState<string[][]>(
    Array.from({ length: totalAttempts }, () => Array(targetCharNum).fill(""))
  );

  const handleInputChange = (row: number, col: number, value: string) => {
    // Can only modify the current row
    if (row !== currentAttempt) {
      return;
    }

    const updatedGuess = currentGuess.map((row) => [...row]); // create a deep copy
    updatedGuess[row][col] = value.toUpperCase(); // Change input
    setCurrentGuess(updatedGuess); // update input
  };

  // Press "Enter" = Press gues
  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleGuess();
    }
  };

  const handleGuess = () => {
    // If still have empty grid, do not submit guess
    if (currentGuess[currentAttempt].some((value) => value == "")) {
      return;
    }

    const fullGuess = currentGuess.join("");
    setCurrentAttempt(currentAttempt + 1);
    if (fullGuess == targetWord) {
      console.log("Right!");
    }
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
    <div className="wordle-container">
      <div className="left-column">
        <div className="presenter">
          <h2>Presenter:</h2>
          <img
            src={`${presenter?.profileImage}`}
            alt="Presenter's Image"
            className="presenter-avatar"
          />
          <p>{presenter?.displayName}</p>
        </div>
      </div>
      <div className="main-column" onKeyDown={handleKeyPress}>
        <h1>Welcome to Wordle, {user.displayName}!</h1>
        <p>Attempts: {currentAttempt}</p>
        <div className="wordle-input">
          {currentGuess.map((_, rowIndex) => (
            <div key={rowIndex} className="wordle-input-row">
              {currentGuess[rowIndex].map((letter, columnIndex) => (
                <input
                  key={columnIndex}
                  type="text"
                  maxLength={1}
                  value={letter}
                  onChange={(e) =>
                    handleInputChange(rowIndex, columnIndex, e.target.value)
                  }
                />
              ))}
            </div>
          ))}
        </div>
        <button className="common-button" onClick={handleGuess}>
          Guess
        </button>
        <button className="common-button" onClick={handleBack}>
          Back
        </button>
      </div>
      <div className="right-column">
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
        </div>
      </div>

      {/* show profile popup */}
      {isAdmin && showProfilePopup && selectedUserProfile && (
        <div className="popup">
          <p>First name: {selectedUserProfile.firstName}</p>
          <p>Last name: {selectedUserProfile.lastName}</p>
          <p>Country: {selectedUserProfile.country}</p>
          <p>City: {selectedUserProfile.city}</p>
          <p>Feeling: {selectedUserProfile.feeling}</p>
          <p>Favourite food: {selectedUserProfile.favFood}</p>
          <p>Favourite activity: {selectedUserProfile.favActivity}</p>
          <button onClick={() => setShowProfilePopup(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

export default Wordle;
