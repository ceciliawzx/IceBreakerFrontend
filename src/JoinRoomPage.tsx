import React, { useState } from 'react';
import './JoinRoomPage.css';

const JoinRoomPage = () => {
    const [displayName, setDisplayName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        try {
            const response = await fetch(`http://ljthey.co.uk:8080/joinRoom?roomNumber=${roomCode}`);
            const data = await response.text();

            if (data.includes("You have joined room")) {
                setMessage(data); // Success message
            } else {
                setMessage("Join Room Failed"); // Error message
            }
        } catch (error) {
            setMessage("Join Room Failed"); // Error message
        }
    };


    return (
        <div className="form-container">
            <form onSubmit={handleSubmit} className="form">
                <input 
                    type="text" 
                    className="form-input"
                    value={displayName} 
                    onChange={(e) => setDisplayName(e.target.value)} 
                    placeholder="Display Name" 
                />
                <input 
                    type="text" 
                    className="form-input"
                    value={roomCode} 
                    onChange={(e) => setRoomCode(e.target.value)} 
                    placeholder="Room Code" 
                />
                <button type="submit" className="submit-button">Join Room</button>
                {message && <p className="message">{message}</p>}
            </form>
        </div>
    );    
};

export default JoinRoomPage;
