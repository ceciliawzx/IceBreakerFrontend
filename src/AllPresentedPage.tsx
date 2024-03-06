import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import jsPDF from "jspdf";

/* Macro and Type */
import { serverPort } from "./macro/MacroServer";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import { SimilarityReports, ReportEntry } from "./type/SimilarityReport";

/* General function */
import { exportUserProfileAsPDF, addPDFInfo } from "./utils/ExportPDF";
import { isSameUser } from "./utils/CommonCompare";

/* Image used */
import celebrationLeft from "./assets/CelebrationLeft.png";
import celebrationRight from "./assets/CelebrationRight.png";

/* CSS */
import "./css/CommonStyle.css";
import "./css/AllPresentedPage.css";

const AllPresentedPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  /* Location passed field */
  const user = location.state?.user;
  const roomCode = user.roomCode;
  const displayName = user.displayName;

  /* Users in room */
  const [admin, setAdmin] = useState<User | null>(null);
  const [allUserProfile, setAllUserProfile] = useState<UserProfile[]>([]);
  const [selectedUserProfile, setSelectedUserProfile] =
    useState<UserProfile | null>(null);
  const [similarityReports, setSimilarityReports] =
    useState<SimilarityReports | null>(null);

  /* Popup */
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [showDestroyPopUp, setShowDestroyPopUp] = useState(false);
  const [showDismissPopUp, setShowDismissPopup] = useState(false);

  /* UI render */
  const [render, setRender] = useState(false);
  const [loadingSimilarityReports, setLoadingSimilarityReports] =
    useState(true);

  /* -------- Use Effect ---------- */

  /* Initial pull */
  useEffect(() => {
    fetchUsers();
    fetchSimilarityReports();
  }, []);

  /* When fetch completed, start render */
  useEffect(() => {
    if (allUserProfile !== null && admin !== null && !render) {
      setRender(true);
    }
  }, [allUserProfile, admin]);

  /* -------- Button Handler ---------- */

  /* When click BackToHomePage button, navigate */
  const handleBackToHomePage = async () => {
    // Normal user, jump back
    if (!isSameUser(user, admin)) {
      navigate("/");
    } else {
      // If admin, check if dismiss room
      setShowDestroyPopUp(true);
    }
  };

  /* When admin click BackToHomePage button, destroy room */
  const handleDestroyRoom = async () => {
    const response = await fetch(
      `${serverPort}/destroyRoom?roomCode=${roomCode}`,
      {
        method: "DELETE",
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    } else {
      navigate("/");
    }
  };

  /* When click ViewProfile button */
  const handleViewProfile = async (selectedUser: UserProfile | null) => {
    const foundUser =
      allUserProfile.find(
        (user) => user && user.userID === selectedUser?.userID
      ) || null;

    setSelectedUserProfile(foundUser);

    setShowProfilePopup(true);
  };

  /* When click ExportPDF in ViewProfile button */
  const handleExportUserProfileAsPDF = (selectedUserProfile: UserProfile) => {
    const userSpecificReport: Partial<SimilarityReports> =
      findSimilarityReport(selectedUserProfile);
    exportUserSimilarityReportAsPDF(userSpecificReport, selectedUserProfile);
  };

  /* -------- Check status ---------- */

  /* Get all users info */
  const fetchUsers = async () => {
    try {
      const response = await fetch(
        `${serverPort}/getPlayers?roomCode=${roomCode}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();

      let userProfiles;
      if (isSameUser(data.admin, data.presenter)) {
        userProfiles = [data.admin, ...data.otherPlayers];
      } else {
        userProfiles = [
          ...[data.admin],
          ...[data.presenter],
          ...data.otherPlayers,
        ];
      }

      setAllUserProfile(userProfiles);
      setAdmin(data.admin);
    } catch (error) {
      console.error("Error fetching all users: ", error);
    }
  };

  /* Get similiarity report */
  const fetchSimilarityReports = async () => {
    try {
      const response = await fetch(
        `${serverPort}/fetchReportsForUser?roomCode=${roomCode}&userID=${user.userID}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }
      const data = await response.json();
      setSimilarityReports(data.reports);
      console.log("receive reports from server: ", data.reports);
    } catch (error) {
      console.error("Error fetching reports for user: ", error);
    } finally {
      setLoadingSimilarityReports(false); // Update loading state regardless of success or failure
    }
  };

  /* -------- Export PDF ---------- */

  /* Export every pdf */
  const exportAllUserProfileAsPDF = async () => {
    for (const userProfile of allUserProfile) {
      await new Promise((resolve) => {
        console.log("exporting user profile as PDF: ", userProfile);
        exportUserProfileAsPDF(userProfile); // Assuming this is synchronous or has a callback
        setTimeout(resolve, 1000); // Wait for 1 second before proceeding to the next PDF (adjust as needed)
      });
    }
  };

  /* Export all users in same pdf */
  const exportAllInSinglePDF = async () => {
    const doc = new jsPDF("p", "mm", "a4", true);

    for (let i = 0; i < allUserProfile.length; i++) {
      const similarityReport = findSimilarityReport(allUserProfile[i]);
      console.log("exporting user profile as PDF: ", allUserProfile[i]);
      addPDFInfo(doc, allUserProfile[i]);

      // Check if it's not the last iteration
      if (i < allUserProfile.length - 1) {
        doc.addPage(); // Add a new page for the next user (adjust as needed)
      }
    }

    doc.save("all_user_profiles.pdf");
  };

  /* Export similaroty report */
  const exportUserSimilarityReportAsPDF = (
    userSpecificReport: Partial<SimilarityReports>,
    selectedUserProfile: UserProfile
  ) => {
    // Check if userSpecificReport has any non-empty categories
    if (
      Object.values(userSpecificReport).some(
        (category) => Object.keys(category).length > 0
      )
    ) {
      console.log(
        "Exporting user profile with specific report: ",
        selectedUserProfile,
        userSpecificReport
      );
      exportUserProfileAsPDF(selectedUserProfile);
    } else {
      // If no specific reports were found for the selected user, export the profile without them
      console.log(
        "Exporting user profile without specific report: ",
        selectedUserProfile
      );
      exportUserProfileAsPDF(selectedUserProfile);
    }
  };

  /* -------- UI Component ---------- */

  /* Format similarity report */
  const findSimilarityReport = (selectedUserProfile: UserProfile) => {
    let userSpecificReport: Partial<SimilarityReports> = {
      similar_activities: {},
      similar_cities: {},
      similar_countries: {},
      similar_feelings: {},
      similar_foods: {},
    };

    // Iterate over each category in the similarityReports
    if (similarityReports) {
      (
        Object.entries(similarityReports) as [
          keyof SimilarityReports,
          ReportEntry
        ][]
      ).forEach(([category, reports]) => {
        // Check if the selected user's ID is mentioned in the current category
        if (reports[selectedUserProfile.userID]) {
          // If so, add this report to the userSpecificReport object under the appropriate category
          userSpecificReport[category] = {
            [selectedUserProfile.userID]: reports[selectedUserProfile.userID],
          };
        }
      });
    }
    return userSpecificReport;
  };

  const displaySimilarityReports = () => {
    if (loadingSimilarityReports) {
      return (
        <div className="similarity-report">
          <p>Loading similarity reports...</p>
        </div>
      ); // Display a loading message or spinner
    }

    // Initialize a variable to track if we have any report entries to display
    let hasReportEntries = false;

    if (!similarityReports) {
      return (
        <div className="similarity-report">
          <h2>Unable to fetch similarity report</h2>
        </div>
      );
    }

    const content = Object.entries(similarityReports).map(
      ([category, report]) => {
        const reportEntries = Object.entries(report);
        if (reportEntries.length === 0) {
          return null; // Skip rendering this category
        }

        // Since we have report entries, set hasReportEntries to true
        hasReportEntries = true;

        return (
          <div key={category}>
            <h3>{category.replaceAll("_", " ").toUpperCase()}</h3>
            {reportEntries.map(([userId, details]) => (
              <p key={userId}>{JSON.stringify(details)}</p> // Assuming `details` is the text to display
            ))}
          </div>
        );
      }
    );

    // If after going through all categories, we found no entries to display
    if (!hasReportEntries) {
      return (
        <div className="similarity-report">
          <h2>Have You noticed that:</h2>
          <p>You are so unique!</p>
          <p>
            It's time to meet others from different cultures and with diverse
            hobbies.
          </p>
        </div>
      );
    }

    return (
      <div className="similarity-report">
        <h2>Have You noticed that:</h2>
        {content}
      </div>
    );
  };

  /* Main renderer */
  return render ? (
    <div className="page">
      <img src={celebrationLeft} className="celebration-left" />
      <img src={celebrationRight} className="celebration-right" />
      <h1>Congratulations, {displayName}! </h1>
      <h1>You have finished the Icebreaker!</h1>

      <div className="row-container">
        {allUserProfile.map((guest, index) => (
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

                  <p>{guest.displayName}{user.userID === guest.userID? " (YOU)" : ""}</p>
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

      {displaySimilarityReports()}

      <button
        className="button common-button"
        onClick={exportAllUserProfileAsPDF}
      >
        Export Each Profile as PDF
      </button>

      <button className="button common-button" onClick={exportAllInSinglePDF}>
        Export All Profiles in One PDF
      </button>

      <button
        className="button common-button"
        onClick={handleBackToHomePage}
        style={{ marginTop: "5%" }}
      >
        Back to HomePage
      </button>

      {/* Show profile popup */}
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
              onClick={() => handleExportUserProfileAsPDF(selectedUserProfile)}
            >
              Export as PDF
            </button>
          </div>
        </div>
      )}

      {/* Admin destroy room popup */}
      {showDestroyPopUp && (
        <div className="overlay-popup">
          <div className="popup">
            <div>
              <p>If you leave, the room will be dismissed.</p>
              <p>Do you really want to dismiss the room?</p>
            </div>

            <div className="column-container">
              <button
                className="button admin-only-button"
                onClick={() => setShowDestroyPopUp(false)}
              >
                Stay in the room
              </button>

              <button
                className="button red-button"
                onClick={() => handleDestroyRoom()}
              >
                Dismiss room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dimissed popup */}
      {showDismissPopUp && (
        <div className="overlay-popup">
          <div className="popup">
            <p>
              Room {roomCode} dismissed by moderator.
              <br />
              Returning to homepage.
            </p>
            <button
              className="button common-button"
              onClick={() => navigate("/")}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  ) : (
    <></>
  );
};

export default AllPresentedPage;
