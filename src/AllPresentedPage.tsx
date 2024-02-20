import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { serverPort } from "./macro/MacroServer";
import { refreshTime } from "./macro/MacroConst";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import exportUserProfileAsPDF from "./utils/ExportPDF";
import "./css/CommonStyle.css";

const AllPresentedPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const roomCode = user.roomCode;
  const displayName = user.displayName;

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserProfile, setSelectedUserProfile] = useState<UserProfile | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);


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

  const fetchUsers = async () => {
    try {
      const response = await fetch(`${serverPort}/getPlayers?roomCode=${roomCode}`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      let users;
      if (data.admin === data.presenter) {
        users = [data.admin, ...data.otherPlayers];
      } else {
        users = [...[data.admin], ...[data.presenter], ...data.otherPlayers];
      }
      setAllUsers(users);
      console.log("all users: ", data);

    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  // Fetch all users when component mounts
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchUsers();
    }, refreshTime);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="page">
      <h1>Congrautalations, {displayName}! </h1>
      <h1>You have finished the Icebreaker!</h1>
      <div className="column-container">
        {allUsers.map((user) => (
          <li key={user.userID} className="user-display">
            <span>{user.displayName}</span>
            <button
              onClick={() => handleViewProfile(user)}
              className="common-button"
            >
              View Profile
            </button>
          </li>
        ))}
      </div>

      <button
        className="button common-button"
        onClick={() => navigate("/")}
      >
        Back to HomePage
      </button>

      {/* show profile popup */}
      {showProfilePopup && selectedUserProfile && (
        <div className="outside-popup">
          <p>First name: {selectedUserProfile.firstName}</p>
          <p>Last name: {selectedUserProfile.lastName}</p>
          <p>Country: {selectedUserProfile.country}</p>
          <p>City: {selectedUserProfile.city}</p>
          <p>Feeling: {selectedUserProfile.feeling}</p>
          <p>Favourite food: {selectedUserProfile.favFood}</p>
          <p>Favourite activity: {selectedUserProfile.favActivity}</p>
          <button
            className="button common-button"
            onClick={() => setShowProfilePopup(false)}
          >
            Close
          </button>
          <div>
            <button
              className="button common-button"
              onClick={() => exportUserProfileAsPDF(selectedUserProfile)}
            >
              Export as PDF
            </button>
          </div>
        </div>
      )}
    
    </div>
    
  );
};

export default AllPresentedPage;