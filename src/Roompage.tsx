import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

interface RoomPageProps {}

function RoomPage() {
  const navigate = useNavigate();
  const { holderName } = useParams<{ holderName: string }>();
  const [joinLink, setJoinLink] = useState<string>(''); // State to store the join link

  const handleBack = () => {
    navigate(-1); // Navigate back to the previous page
  };

  return (
    <div className="room-page">
      <h1>{holderName}'s Room</h1>
      <div className="join-link">
        <p>Share this link to invite others:</p>
        <input
          type="text"
          value={joinLink}
          readOnly
          onClick={(e) => (e.target as HTMLInputElement).select()} // Cast to HTMLInputElement
        />
      </div>
      <button onClick={handleBack}>Go Back</button>
      {/* Other content goes here */}
    </div>
  );
}

export default RoomPage;
