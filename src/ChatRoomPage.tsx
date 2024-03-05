import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

/* Macro */
import { serverPort } from "./macro/MacroServer";

/* Web socket */
import {
  connect,
  sendMsg,
  socketUrl,
  websocketUrl,
} from "./utils/WebSocketService";
import { TimerMessage } from "./type/Timer";

/* CSS */
import "./css/ChatRoomPage.css";

/* Web socket message interface */
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

  /* Location passed field */
  const user = location.state?.user;
  const userID = user.userID;
  const displayName = user.displayName;
  const roomCode = user.roomCode;

  /* Web socket url */
  const topic = `/topic/room/${roomCode}/chatRoom`;
  const destination = `/app/room/${roomCode}/sendMessage`;

  /* Chatroom related */
  const [message, setMessage] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatMessageExtended[]>([]);
  const [isTimerStarted, setIsTimerStarted] = useState(false);

  /* UI render */
  const [render, setRender] = useState(false);

  /* When launch, Connet to web socket */
  useEffect(() => {
    const cleanup = connect(
      socketUrl,
      websocketUrl,
      topic,
      onMessageReceived,
      setRender
    );
    return cleanup;
  }, []);

  /* -------- Web Socket ---------- */

  /* Send message via websocket */
  const handleSendMessage = () => {
    if (!isTimerStarted) return;
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

  const onMessageReceived = (msg: ChatMessage | TimerMessage) => {
    if ("started" in msg && msg.started) {
      // If msg has started field, it's TimerMessage
      setIsTimerStarted(true);
    } else {
      // Otherwise, it's ChatMessage
      setChatHistory((prevHistory) => [
        ...prevHistory,
        { ...(msg as ChatMessage), decisionMade: false },
      ]);
    }
  };

  /* -------- Button Handler ---------- */

  /* When click Keyboard ENTER, send message  */
  const handleKeyPress = (e: any) => {
    if (!isTimerStarted) return;
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  /* When click SetGuessRight button, see the message as a right guess */
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

  /* -------- Helper function ---------- */

  /* If someone guessed it right, display system message */
  const extractMessage = (fullMessage: string) => {
    if (fullMessage.includes("Server has received your message")) {
      const parts = fullMessage.split(":");
      if (parts.length > 1) {
        // Remove the first part ("Server has received your message")
        parts.shift();
        // Rejoin the remaining parts with ":" to restore the original message content
        const message = parts.join(":").trim();
        return message;
      }
    } else {
      return fullMessage;
    }
  };

  /* -------- UI Component ---------- */

  /* Main renderer */
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
                      className="button small-button common-button"
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
                      className="button small-button common-button"
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
            disabled={!isTimerStarted}
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
