import React, { useState, useEffect } from "react";
import "./ChatRoomPage.css";
import { connect, sendMsg } from "./ChatService";

interface ChatMessage {
  roomNumber: number;
  content: string;
  timestamp: string;
  sender: string;
}


const ChatRoom: React.FC = () => {
  const [roomNumber, setRoomNumber] = useState<number>(0);
  const [name, setName] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  useEffect(() => {
    connect(roomNumber, (msg: ChatMessage) => {
      setChatHistory(prevHistory => [...prevHistory, msg]);
    });
  }, []);

  const handleSendMessage = () => {
    if (message.trim() !== "") {
      sendMsg({ roomNumber, content: message, timestamp: new Date().toISOString(), sender: name });
      setMessage('');

    }
  };

  const handleKeyPress = (e: any) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  return (
    <div className={`chat-room-page`}>
      <div className="chat-room-bar">
        <div className="message-display">
          {chatHistory.map((msg, index) => (
            <div key={index} className="message">
              {msg.sender}: {msg.content}
            </div>
          ))}
        </div>
        <div className="input-container" onKeyDown={handleKeyPress}>
          <input type="number" value={roomNumber} onChange={e => setRoomNumber(parseInt(e.target.value))} placeholder="Room Number" />
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" />
          <input type="text" value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." />
          <button onClick={handleSendMessage}>Send</button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
