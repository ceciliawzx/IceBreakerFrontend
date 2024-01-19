import React, { useState } from "react";
import "./ChatRoomPage.css";

const ChatRoomBar: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
  };

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      setMessages([...messages, message]);
      setMessage("");
    }
  };

  const handleKeyPress = (e: any) => {
    // Check if the Enter key is pressed (key code 13)
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className="chat-room-page">
      <div className="chat-room-bar">
        <div className="message-display">
          {messages.map((msg, index) => (
            <div key={index} className="message">
              {msg}
            </div>
          ))}
        </div>
        <div className="input-container">
          <input
            type="text"
            placeholder="Type your message..."
            onKeyDown = {handleKeyPress}
            value={message}
            onChange={handleMessageChange}
          />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoomBar;
