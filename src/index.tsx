import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import './css/index.css';
import Homepage from './Homepage';
import JoinRoomPage from './JoinRoomPage';
import WaitRoomPage from './WaitRoomPage';
import UserProfilePage from './UserProfilePage';
import reportWebVitals from './service/reportWebVitals';
import CreateRoomPage from './CreateRoomPage';
import ChatRoomPage from './ChatRoomPage';
import PictionaryPage from './PictionaryPage';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <Router>
    <Routes>
      <Route path='/' element={<Homepage />} />
      <Route path='/CreateRoomPage' element={<CreateRoomPage />} />
      <Route path='/JoinRoompage' element={<JoinRoomPage />} />
      <Route path='/WaitRoomPage' element={<WaitRoomPage />} />
      <Route path='/UserProfilePage' element={<UserProfilePage />} />
      <Route path='/ChatRoomPage' element={<ChatRoomPage />} />
      <Route path='/PictionaryRoomPage' element={<PictionaryPage />} />
    </Routes>
  </Router>
);
reportWebVitals();
