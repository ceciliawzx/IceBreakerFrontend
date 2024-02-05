import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
// import { subscribeToTimer, subscribeToNavigation } from "./websocketService"; // Placeholder for your actual WebSocket integration

const Timer = ({ roomCode }: { roomCode: string }) => {
//   const [countdown, setCountdown] = useState<number>();
//   const navigate = useNavigate();

//   useEffect(() => {
//     // Subscribe to timer updates
//     const unsubscribeTimer = subscribeToTimer(roomCode, (newCountdown: number) => {
//       setCountdown(newCountdown);
//     });

//     // Subscribe to navigation commands
//     const unsubscribeNavigate = subscribeToNavigation(
//       roomCode,
//       (navigateTo) => {
//         navigate(navigateTo);
//       }
//     );

//     // Cleanup on component unmount
//     return () => {
//       unsubscribeTimer();
//       unsubscribeNavigate();
//     };
//   }, [roomCode, navigate]);

//   return (
//     <div className="timer">
//       {countdown !== null ? (
//         <span>Time Left: {countdown} seconds</span>
//       ) : (
//         <span>Waiting for timer to start...</span>
//       )}
//     </div>
//   );
};

export default Timer;
