import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { connect, sendMsg } from "./ChatService";
import "./ChatRoomPage.css";


interface ChatMessage {
  roomNumber: number;
  content: string;
  timestamp: string;
  sender: string;
}


const ChatRoom: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const userID = location.state?.userID
  const displayName = location.state?.displayName
  const roomCode = location.state?.roomCode
  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    connect(roomCode, (msg: ChatMessage) => {
      setChatHistory(prevHistory => [...prevHistory, msg]);
    });
  }, []);

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      sendMsg({ roomCode, content: message, timestamp: new Date().toISOString(), sender: displayName });
      setMessage('');
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const extractMessage = (fullMessage: string) => {
    if (fullMessage.includes("Server has received your message")) {
      const parts = fullMessage.split(':');
      if (parts.length === 2) {
        const message = parts[1].trim();
        return `${message}`;
      }
    } else {
      return fullMessage
    }
  } 

  return (
    <div className={`chat-room-page`}>
      <div className="chat-room-bar">
        <div className="chat-room-header">
        <div className="room-details">
          Room Code: {roomCode} | Display Name: {displayName}
        </div>
        </div>
        <div className="message-display">
          {chatHistory.map((msg, index) => (
            <div key={index} className="message">
              <span className={msg.sender === displayName ? 'green-sender' : 'yellow-sender'}>{msg.sender}:</span>
              
              <span>{extractMessage(msg.content)}</span>
            </div>
          ))}
          
        </div>
        <div className="input-container" onKeyDown={handleKeyPress}>
          <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
