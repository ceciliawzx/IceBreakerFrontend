import React, { Component } from 'react';
import './Homepage.css';

class Homepage extends Component {
  handleCreateRoom() {
    console.log('Create Room clicked');
  }

  handleJoinRoom() {
    console.log('Join Room clicked');
  }

  render() {
    return (
      <div className="home-page">
        <h1>Welcome to the Room Page</h1>
        <div className="button-container">
          <button className="button" onClick={this.handleCreateRoom}>
            Create Room
          </button>
          <button className="button" onClick={this.handleJoinRoom}>
            Join Room
          </button>
        </div>
      </div>
    );
  }
}

export default Homepage;
