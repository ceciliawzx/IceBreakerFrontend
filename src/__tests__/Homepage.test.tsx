import { render, fireEvent, screen } from '@testing-library/react';
import { HashRouter as Router } from 'react-router-dom';
import Homepage from '../Homepage';

const homepageComponent = (
  <Router>
    <Homepage />
  </Router>
);

it('should log "Create Room clicked" on click Create Room button', () => {
  render(homepageComponent);
  
  // Find the Create Room button
  const createRoomButton = screen.getByTestId('create-room-button');

  // Trigger button click
  fireEvent.click(createRoomButton);

  // Check if the log message is displayed
  const logMessage = screen.getByTestId('log-message');
  expect(logMessage).toHaveTextContent('Create Room clicked');
});

it('should log "Join Room clicked" on click Join Room button', () => {
  render(homepageComponent);
  
  // Find the Join Room button
  const joinRoomButton = screen.getByTestId('join-room-button');

  // Trigger button click
  fireEvent.click(joinRoomButton);

  // Check if the log message is displayed
  const logMessage = screen.getByTestId('log-message');
  expect(logMessage).toHaveTextContent('Join Room clicked');
});
