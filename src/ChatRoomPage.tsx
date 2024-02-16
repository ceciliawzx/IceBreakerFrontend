import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { connect, sendMsg } from "./utils/WebSocketService";
import { serverPort, websocketPort } from "./macro/MacroServer";
import "./css/ChatRoomPage.css";

interface ChatMessage {
  roomNumber: number;
  content: string;
  timestamp: string;
  sender: string;
  senderId: string;
}

const ChatRoom: React.FC = () => {
  const location = useLocation();
  const user = location.state?.user;
  const userID = user.userID;
  const displayName = user.displayName;
  const roomCode = user.roomCode;
  const [message, setMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const socketUrl = `${serverPort}/chat?userId=${userID}`;
  const websocketUrl = `${websocketPort}/chat?userId=${userID}`;
  const topic = `/topic/room/${roomCode}`;
  const destination = `/app/room/${roomCode}/sendMessage`;

  useEffect(() => {
    const onMessageReceived = (msg: ChatMessage) => {
        setChatHistory((prevHistory) => [...prevHistory, msg])};
    connect(socketUrl, websocketUrl, topic, onMessageReceived);
  }, []);

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      sendMsg(destination, {
        roomCode,
        content: message,
        timestamp: new Date().toISOString(),
        sender: displayName,
        senderId: userID,
      });
      setMessage("");
    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const extractMessage = (fullMessage: string) => {
    if (fullMessage.includes("Server has received your message")) {
      const parts = fullMessage.split(":");
      if (parts.length === 2) {
        const message = parts[1].trim();
        return `${message}`;
      }
    } else {
      return fullMessage;
    }
  };

  return (
    <div className={`chat-room-page`}>
      <div className="chat-room-bar">
        <div className="chat-room-header">
          <div className="room-details">
            Room Code:
            <span className="highlighted-sender">{roomCode}</span> | Display
            Name:
            <span className="highlighted-sender">{displayName}</span>
          </div>
        </div>
        <div className="message-display">
          {chatHistory.map((msg, index) => (
            <div key={index} className="message">
              <span
                className={
                  msg.sender === displayName ? "green-sender" : "yellow-sender"
                }
              >
                {msg.sender}:
              </span>

              <span>{extractMessage(msg.content)}</span>
            </div>
          ))}
        </div>
        <div className="input-container" onKeyDown={handleKeyPress}>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
          />
          <button className="button small-common-button" onClick={handleSendMessage}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
