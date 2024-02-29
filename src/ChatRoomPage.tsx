import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  connect,
  sendMsg,
  socketUrl,
  websocketUrl,
} from "./utils/WebSocketService";
import "./css/ChatRoomPage.css";
import { websocketPort, serverPort } from "./macro/MacroServer";

interface ChatMessage {
  roomNumber: number;
  content: string;
  timestamp: string;
  sender: string;
  senderId: string;
}

interface ChatMessageExtended extends ChatMessage {
  decisionMade?: boolean;
}

const ChatRoom = ({ isPresenter }: { isPresenter: boolean }) => {
  const location = useLocation();
  const user = location.state?.user;
  const userID = user.userID;
  const displayName = user.displayName;
  const roomCode = user.roomCode;
  const [message, setMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessageExtended[]>([]);

  const [render, setRender] = useState(false);

  const topic = `/topic/room/${roomCode}`;
  const destination = `/app/room/${roomCode}/sendMessage`;

  useEffect(() => {
    const onMessageReceived = (msg: ChatMessage) => {
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { ...msg, decisionMade: false },
      ]);
    };

    const cleanup = connect(
      socketUrl,
      websocketUrl,
      topic,
      onMessageReceived,
      setRender
    );
    return cleanup;
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

  const handleGuessDecision = async ({
    message,
    guessedCorrect,
  }: {
    message: ChatMessage;
    guessedCorrect: boolean;
  }) => {
    if (guessedCorrect) {
      try {
        const response = await fetch(
          `${serverPort}/guessedCorrect?roomCode=${roomCode}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`); // Error message
        }
      } catch (error) {
        console.error("Error decising guess message:", error);
      }
    }
    // Update the decisionMade property for the message
    setChatHistory((currentHistory) =>
      currentHistory.map((msg) =>
        msg.timestamp === message.timestamp
          ? { ...msg, decisionMade: true }
          : msg
      )
    );
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
            <div
              key={index}
              className={msg.sender === "System" ? "system-message" : "message"}
            >
              <span
                className={
                  msg.sender === displayName ? "green-sender" : "yellow-sender"
                }
              >
                {msg.sender}: {""}
              </span>
              <span>{extractMessage(msg.content)}</span>
              {isPresenter &&
                msg.sender !== "System" &&
                msg.sender !== displayName &&
                !msg.decisionMade && (
                  <div>
                    <button
                      className="button small-common-button"
                      onClick={() =>
                        handleGuessDecision({
                          message: msg,
                          guessedCorrect: true,
                        })
                      }
                      title="Correct"
                    >
                      ✓
                    </button>
                    <button
                      className="button small-common-button"
                      onClick={() =>
                        handleGuessDecision({
                          message: msg,
                          guessedCorrect: false,
                        })
                      }
                      title="Incorrect"
                    >
                      ×
                    </button>
                  </div>
                )}
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
          <button
            className="button small-button common-button"
            onClick={handleSendMessage}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
