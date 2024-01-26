import React from 'react';
import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';
import { serverPort, websocketPort } from '../MacroConst';

let client: Client | null = null;

const connect = (
  roomCode: string,
  userId: string,
  onMessageReceived: (msg: any) => void
) => {
  const socketUrl = `${serverPort}/chat?userId=${userId}`;
  const websocketUrl = `${websocketPort}chat?userId=${userId}`;

  const socket = new SockJS(socketUrl);
  client = new Client({
    brokerURL: websocketUrl,
    webSocketFactory: () => socket,
    onConnect: () => {
      console.log('Connected to STOMP server'); // Logging connection
      setTimeout(() => {
        if (client && client.connected) {
          console.log(`Subscribing to /topic/room/${roomCode}/drawing`);
          client.subscribe(`/topic/room/${roomCode}/drawing`, (message) => {
            console.log(`message ${message}`);
            console.log(`Received message ${JSON.parse(message.body)}`);
            onMessageReceived(JSON.parse(message.body));
          });
        } else {
          console.error('STOMP client is not connected');
        }
      }, 1000); // Delay of 1 second
    },
    onStompError: (frame) => {
      console.error('Broker reported error: ' + frame.headers['message']);
      console.error('Additional details: ' + frame.body);
    },
  });
  client.activate();
};

const sendDrawingMsg = (msg: any) => {
  if (client && client.connected) {
    client.publish({
      destination: `/app/room/${msg.roomNumber}/sendDrawing`,
      body: JSON.stringify(msg),
    });
  }
};

export { connect, sendDrawingMsg };
