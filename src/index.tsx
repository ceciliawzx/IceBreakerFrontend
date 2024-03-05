import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import reportWebVitals from "./service/reportWebVitals";

/* Page */
import Homepage from "./Homepage";
import CreateRoomPage from "./CreateRoomPage";
import JoinRoomPage from "./JoinRoomPage";
import JoinMockRoomPage from "./JoinMockRoomPage";
import WaitRoomPage from "./WaitRoomPage";
import UserProfilePage from "./UserProfilePage";
import PresentPage from "./PresentPage";
import GeoguesserPage from "./GeoguesserPage";
import PictionaryPage from "./PictionaryPage";
import WordlePage from "./WordlePage";
import HangmanPage from "./HangmanPage";
import AllPresentedPage from "./AllPresentedPage";

/* CSS */
import "./css/CommonStyle.css";
import "./css/index.css";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <Router>
    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/CreateRoomPage" element={<CreateRoomPage />} />
      <Route path="/JoinRoompage" element={<JoinRoomPage />} />
      <Route path="/WaitRoomPage" element={<WaitRoomPage />} />
      <Route path="/UserProfilePage" element={<UserProfilePage />} />
      <Route path="/PresentPage" element={<PresentPage />} />
      <Route path="/WordlePage" element={<WordlePage />} />
      <Route path="/PictionaryRoomPage" element={<PictionaryPage />} />
      <Route path="/JoinMockRoompage" element={<JoinMockRoomPage />} />
      <Route path="/GeoguesserPage" element={<GeoguesserPage />} />
      <Route path="/HangmanPage" element={<HangmanPage />} />
      <Route path="/AllPresentedPage" element={<AllPresentedPage />} />
    </Routes>
  </Router>
);
reportWebVitals();
