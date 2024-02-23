import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

let client: Client | null = null;

const generateUID = () => {
  return window.crypto.randomUUID(); // Generates a UUID (v4)
};

const connect = (
  socketUrl: string,
  webSocketUrl: string,
  topic: string,
  onMessageReceived: (msg: any) => void,
  setRender: (render: boolean) => void
) => {
  let subscription: any = null; // This will hold our subscription object
  let sessionId = generateUID();

  // Establishes the connection and sets up the subscription
  const activateClient = () => {
    const socket = new SockJS(socketUrl);
    client = new Client({
      brokerURL: webSocketUrl,
      webSocketFactory: () => socket,
      onConnect: () => {
        setTimeout(() => {
          if (client && client.connected) {
            setRender(true);
            console.log(
              `Subscribing to topic ${topic} with sessionId ${sessionId}`
            );
            subscription = client.subscribe(topic, (message) => {
              console.log(
                "receiving message ",
                message.body,
                " from sessionId: ",
                sessionId
              );
              onMessageReceived(JSON.parse(message.body));
            });
          } else {
            console.error("STOMP client is not connected");
          }
        }, 100); // Delay of 0.1 second
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
      },
    });
    client.activate();
  };

  // Cleanup function to be called on component unmount
  const cleanup = () => {
    // Unsubscribe before deactivating the client
    if (subscription) {
      console.log(`Unsubscribing from topic with sessionId ${sessionId}`);
      subscription.unsubscribe();
      subscription = null; // Clear the subscription reference
    }
    if (client) {
      console.log(
        `Disconnecting from STOMP server with sessionId ${sessionId}`
      );
      client
        .deactivate()
        .then(() => {
          console.log("Disconnected successfully");
        })
        .catch((err) => {
          console.error("Error during disconnection:", err);
        });
      client = null; // Clear the client reference
    }
  };

  activateClient();

  return cleanup;
};

const sendMsg = (destination: string, msg: any) => {
  if (client && client.connected) {
    client.publish({ destination: destination, body: JSON.stringify(msg) });
  }
};

export { connect, sendMsg };
