import React, { useState } from "react";
import "./ChatRoomPage.css";

const ChatRoomBar: React.FC = () => {
  const [message, setMessage] = useState<string>("");
  const [messages, setMessages] = useState<string[]>([]);
  const [isEnlarged, setIsEnlarged] = useState<boolean>(false);

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
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const toggleSize = () => {
    setIsEnlarged(!isEnlarged);
  };

  return (
    // <div className="chat-room-page">
    <div className={`chat-room-page ${isEnlarged ? 'enlarged' : ''}`}>
      {isEnlarged ? (
      <div className="chat-room-bar">
        <button className="toggle-top" onClick={toggleSize}>
          chat
        </button>
        <div className="message-display">
            {messages.map((msg, index) => (
              <div key={index} className="message">
                {msg}
              </div>
            ))}
          </div><div className="input-container">
              <input
                type="text"
                placeholder="Type your message..."
                onKeyDown={handleKeyPress}
                value={message}
                onChange={handleMessageChange} />
              <button onClick={handleSendMessage}>Send</button>
            </div>
          </div>
        ) : (
          <button className="toggle-button" onClick={toggleSize}>
            chat
          </button>
        )}
    </div>
  );
};

export default ChatRoomBar;
