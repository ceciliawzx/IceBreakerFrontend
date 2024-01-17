import React, { useState } from 'react';
import './JoinRoomPage.css';

const JoinRoomPage = () => {
    const [displayName, setDisplayName] = useState('');
    const [roomCode, setRoomCode] = useState('');

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        // Add validation and navigation logic here
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
            </form>
        </div>
    );    
};

export default JoinRoomPage;
