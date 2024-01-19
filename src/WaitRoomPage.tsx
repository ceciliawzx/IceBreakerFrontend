import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "./WaitRoomPage.css";

const WaitRoomPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const roomCode = location.state?.roomCode || "No join link available";
  const displayName = location.state?.displayName;
  const [guests, setGuests] = useState<string[]>([]);

  const handleStartRoom = () => {
    console.log("Room started!");
    navigate("/UserProfilePage");
  };

  return (
    <div className="wait-room-page">
      <h1>
        Welcome to Wait Room {roomCode}, {displayName}!
      </h1>
      <div className="guest-list">
        <h2>Joined Guests:</h2>
        <ul>
          {guests.map((guest, index) => (
            <li key={index}>{guest}</li>
          ))}
        </ul>
      </div>
      <button className="start-room-button" onClick={handleStartRoom}>
        Start Room
      </button>
    </div>
  );
};

export default WaitRoomPage;
