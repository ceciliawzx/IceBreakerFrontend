// // Homepage.test.tsx
// import React from 'react';
// import { render, fireEvent } from '@testing-library/react';
// import Homepage from '../src/Homepage';

// test('renders Homepage component', () => {
//   const { getByText } = render(<Homepage />);
  
//   // Check if the component renders with the welcome message
//   const welcomeMessage = getByText(/Welcome to the Room Page/i);
//   expect(welcomeMessage).toBeInTheDocument();
// });

// test('logs "Create Room clicked" on Create Room button click', () => {
//   const { getByText, getByTestId } = render(<Homepage />);
  
//   // Find the Create Room button
//   const createRoomButton = getByText(/Create Room/i);

//   // Trigger button click
//   fireEvent.click(createRoomButton);

//   // Check if the log message is displayed
//   const logMessage = getByTestId('log-message');
//   expect(logMessage).toHaveTextContent('Create Room clicked');
// });

// test('logs "Join Room clicked" on Join Room button click', () => {
//   const { getByText, getByTestId } = render(<Homepage />);
  
//   // Find the Join Room button
//   const joinRoomButton = getByText(/Join Room/i);

//   // Trigger button click
//   fireEvent.click(joinRoomButton);

//   // Check if the log message is displayed
//   const logMessage = getByTestId('log-message');
//   expect(logMessage).toHaveTextContent('Join Room clicked');
// });
