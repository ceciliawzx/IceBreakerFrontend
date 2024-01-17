import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Homepage from './Homepage';
import CreateRoomPage from './CreateRoompage';
import JoinRoompage from './JoinRoomPage';
import UserProfilePage from './UserProfilePage';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="CreateRoomPage" element={<CreateRoomPage />} />
        <Route path="JoinRoompage" element={<JoinRoompage />} />
        <Route path="UserProfilePage" element={<UserProfilePage />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
reportWebVitals();