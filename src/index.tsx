import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import Homepage from './Homepage';
import Roompage from './Roompage';
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
        <Route path="Roompage" element={<Roompage />} />
        <Route path="JoinRoompage" element={<JoinRoompage />} />
        <Route path="UserProfilePage" element={<UserProfilePage />} />
      </Routes>
    </Router>
  </React.StrictMode>
);
reportWebVitals();