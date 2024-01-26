import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import './WaitRoomPage.css';
import { refreshTime, serverPort } from './MacroConst';

const WaitRoomPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const userID = user.userID;
  const roomCode = user.roomCode;
  const displayName = user.displayName;
  const [isPresenter, setIsPresenter] = useState(false);
  const [guests, setGuests] = useState<string[]>([]);
  const [admin, setAdmin] = useState<string>('');
  const [isAdmin, setIsAdmin] = useState(false);

  const handleStartRoom = async () => {
    // Tell server that to start room
    const response = await fetch(
      `${serverPort}/startInput?roomCode=${roomCode}`,
      {
        method: 'POST',
      }
    );
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
  };

  const handleChatRoom = () => {
    navigate('/ChatRoomPage', {
      state: { userID, roomCode, displayName },
    });
  };

  const handlePictionaryRoom = async () => {
    const response = await fetch(
      `${serverPort}/startDrawAndGuess?roomCode=${roomCode}`,
      {
        method: 'POST',
      }
    );
    if (!response.ok) {
      throw new Error(
        `HTTP error when entering DrawAndGuess! Status: ${response.status}`
      );
    }
  };

  // Check if the user is the admin
  const checkAdminStatus = async () => {
    const url = `${serverPort}/isAdmin?userID=${userID}&roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setIsAdmin(data === true);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const checkPresenterStatus = async () => {
    const url = `${serverPort}/isPresenter?userID=${userID}&roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      const data = await response.json();
      setIsPresenter(data === true);
      console.log('setting is presenter: ', data);
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  // Fetch the players & check if room start from the backend
  const checkRoomStatus = async () => {
    const url = `${serverPort}/getPlayers?roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Room cannot be found');
      }

      const data = await response.json();
      if (data.admin) {
        setAdmin(data.admin.displayName);
      }
      if (data.otherPlayers) {
        setGuests(
          data.otherPlayers.map(
            (player: { displayName: any }) => player.displayName
          )
        );
      }

      // // if moderator starts game, navigate to input phase
      // if (data.gameStatus) {
      //   navigate("/UserProfilePage", {
      //     state: { user },
      //   });

      // Change Admin to non-presenter when presenting page is completed

      console.log('Game status', data.roomStatus);

      if (data.roomStatus === 'PICTURING') {
        navigate('/PictionaryRoomPage', {
          state: { user },
        });
      }
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  // Periodically check room status
  useEffect(() => {
    // Check whether the user is admin
    checkAdminStatus();
    // Check whether the user is presenter
    checkPresenterStatus();

    // Update the player list every interval
    const intervalId = setInterval(checkRoomStatus, refreshTime);

    // Clear timer and count again
    return () => clearInterval(intervalId);
  }, [userID, roomCode]);

  return (
    <div className='wait-room-page'>
      <h1>
        Welcome to Wait Room {roomCode}, {displayName}!
      </h1>
      <h1>Your ID is {userID}</h1>
      <div className='moderator'>
        <h2>Moderator:</h2>
        <img
          src='/pic.jpg' // {admin.profileImage}
          alt="Moderator's Image"
          className='moderator-avatar'
        />
        <p>{admin}</p>
      </div>
      <div className='guest-list'>
        <h2>Joined Guests:</h2>
        <div className='guest-container'>
          {guests.map((guest, index) => (
            <div key={index} className='guest'>
              <img
                src='/pic.jpg'
                alt={`${guest}'s avatar`}
                className='guest-avatar'
              />
              <p>{guest}</p>
            </div>
          ))}
        </div>
        <div className='river'></div>
      </div>
      {isAdmin && (
        <button className='start-room-button' onClick={handleStartRoom}>
          Start Room
        </button>
      )}
      {
        <button className='start-room-button' onClick={handleChatRoom}>
          Chat Room
        </button>
      }
      {isPresenter && (
        <button className='start-room-button' onClick={handlePictionaryRoom}>
          Pictionary
        </button>
      )}
    </div>
  );
};

export default WaitRoomPage;
