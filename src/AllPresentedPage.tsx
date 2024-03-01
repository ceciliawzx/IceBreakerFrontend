import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { serverPort } from "./macro/MacroServer";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import jsPDF from "jspdf";
import { exportUserProfileAsPDF, addPDFInfo } from "./utils/ExportPDF";
import { disableScroll } from "./utils/CssOperation";
import { isSameUser } from "./utils/CommonCompare";
import "./css/CommonStyle.css";
import "./css/AllPresentedPage.css";
import celebrationLeft from "./assets/CelebrationLeft.png";
import celebrationRight from "./assets/CelebrationRight.png";
import { create } from "domain";

const AllPresentedPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const roomCode = user.roomCode;
  const displayName = user.displayName;

  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserProfile, setSelectedUserProfile] =
    useState<UserProfile | null>(null);
  const [showProfilePopup, setShowProfilePopup] = useState(false);

  // disable scroll for this page
  useEffect(disableScroll, []);

  // Fetch all users when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  const createUserProfile = (user: any) => {
    return new UserProfile(
      user.displayName,
      user.roomCode,
      user.userID,
      user.profileImage,
      user.firstName,
      user.lastName,
      user.country,
      user.city,
      user.feeling,
      user.favFood,
      user.favActivity
    );
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

        setSelectedUserProfile(createUserProfile(data.userInfo));

        setShowProfilePopup(true);
      } catch (error) {
        console.error("Error fetching user details:", error);
      }
    }
  };

  const exportAllUserProfileAsPDF = async () => {
    const url = `${serverPort}/getPlayers?roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }

      const data = await response.json();
      const users = [];
      console.log("start");
      if (data.admin) {
        users.push(createUserProfile(data.admin));
      }
      console.log("done1");
      if (data.presenter && !isSameUser(data.admin, data.presenter)) {
        users.push(createUserProfile(data.presenter));
      }
      console.log("done2");
      if (data.otherPlayers) {
        data.otherPlayers.forEach((player: UserProfile) => {
          users.push(createUserProfile(player));
        });
      }
      console.log("done3");
      for (const userProfile of users) {
        await new Promise((resolve) => {
          console.log("exporting user profile as PDF: ", userProfile);
          exportUserProfileAsPDF(userProfile); // Assuming this is synchronous or has a callback
          setTimeout(resolve, 1000); // Wait for 1 second before proceeding to the next PDF (adjust as needed)
        });
      }
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  const exportAllInSinglePDF = async () => {
    const url = `${serverPort}/getPlayers?roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }

      const data = await response.json();
      const users = [];
      if (data.admin) {
        users.push(createUserProfile(data.admin));
      }
      if (data.presenter && !isSameUser(data.admin, data.presenter)) {
        users.push(createUserProfile(data.presenter));
      }
      if (data.otherPlayers) {
        data.otherPlayers.forEach((player: UserProfile) => {
          users.push(createUserProfile(player));
        });
      }

      const doc = new jsPDF();

      for (let i = 0; i < users.length; i++) {
        console.log("exporting user profile as PDF: ", users[i]);
        addPDFInfo(doc, users[i]);

        // Check if it's not the last iteration
        if (i < users.length - 1) {
          doc.addPage(); // Add a new page for the next user (adjust as needed)
        }
      }

      doc.save("all_user_profiles.pdf");
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${serverPort}/getPlayers?roomCode=${roomCode}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      let users;
      if (isSameUser(data.admin, data.presenter)) {
        users = [data.admin, ...data.otherPlayers];
      } else {
        users = [...[data.admin], ...[data.presenter], ...data.otherPlayers];
      }
      setAllUsers(users);
    } catch (error) {
      console.error("Error fetching all users:", error);
    }
  };

  return (
    <div className="page">
      <img
        src={celebrationLeft}
        alt="Create Room"
        className="celebration-left"
      />
      <img
        src={celebrationRight}
        alt="Create Room"
        className="celebration-right"
      />
      <h1>Congratulations, {displayName}! </h1>
      <h1>You have finished the Icebreaker!</h1>
      <div className="row-container">
        {allUsers.map((guest, index) => (
          <div key={index}>
            <div
              className="row-container"
              style={{ marginLeft: "30px", marginRight: "30px" }}
            >
              <div className="column-container">
                <div className="avatar-container">
                  <img
                    src={`${guest.profileImage}`}
                    alt={`${guest}'s avatar`}
                    className="avatar"
                  />

                  <p>{guest.displayName}</p>
                  <button
                    onClick={() => handleViewProfile(guest)}
                    className="button common-button"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        className="button common-button"
        onClick={exportAllUserProfileAsPDF}
      >
        Export all
      </button>

      <button className="button common-button" onClick={exportAllInSinglePDF}>
        Export in a single PDF
      </button>

      <button
        className="button common-button"
        onClick={() => navigate("/")}
        style={{ marginTop: "5%" }}
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
