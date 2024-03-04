import React, { useState, useCallback, useEffect } from "react";
import GoogleMapReact from "google-map-react";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { serverPort, websocketPort } from "./macro/MacroServer";
import { BackMessage } from "./type/BackMessage";
import { refreshTime } from "./macro/MacroConst";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import { RoomStatus } from "./type/RoomStatus";
import { PresentRoomInfo } from "./type/PresentRoomInfo";
import "./css/Geoguesser.css";
import {
  connect,
  sendMsg,
  socketUrl,
  websocketUrl,
} from "./utils/WebSocketService";
import { Timer } from "./timer/Timer";
import Instructions from "./Instructions";
import geoguesserInstruction from "./instructions/wordle/WordleInstruction.png";
import { updatePresentRoomInfo } from "./utils/RoomOperation";

enum GeoguesserStatus {
  PRE_CHOOSE = "PRE_CHOOSE",
  PLAYER_CHOOSE = "PLAYER_CHOOSE",
  SUBMITTED = "SUBMITTED",
}

const geoguesserInstructions = [
  {
    img: geoguesserInstruction,
    text: "",
  },
];

interface GeoguesserMessage {
  roomCode: string;
  displayName: string;
  location: string;
}

const GOOGLE_MAPS_API_KEY = "AIzaSyDENKVeABbLKd8DG_8H0RJLeh7y4FBqrUs";

const GeoguesserPage: React.FC = () => {
  const [map, setMap] = useState<google.maps.Map>();
  const [mapsApi, setMapsApi] = useState<typeof google.maps>();
  const [historyMarkers, setHistoryMarkers] = useState<
    { lat: number; lng: number }[]
  >([]);
  const [currentMarker, setCurrentMarker] = useState<google.maps.Marker | null>(
    null
  );
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);
  const [isMapInteractive, setIsMapInteractive] = useState(true);
  const [guestWaitingPopup, setGuestWaitingPopup] = useState(false);
  const [geoguesserStatus, setGeoguesserStatus] = useState<GeoguesserStatus>();
  const [showAllSubmitPopup, setShowAllSubmitPopup] = useState(false);
  const [userSubStatus, setUserSubStatus] = useState(false);
  const [streetViewPanorama, setStreetViewPanorama] =
    useState<google.maps.StreetViewPanorama>();
  const [winner, setWinner] = useState<UserProfile[]>([]);
  const [winnerDistance, setWinnerDistance] = useState<number[]>([]);
  const [satelliteImageUrl, setSatelliteImageUrl] = useState<string | null>(
    null
  );
  const [answerMarker, setAnswerMarker] = useState<google.maps.Marker | null>(
    null
  );
  const [answerLocation, setAnswerLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [render, setRender] = useState(false);
  const [otherUserMarkers, setOtherUserMarkers] = useState(new Map());
  const [selectedField, setSelectedField] = useState<keyof PresentRoomInfo>();

  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const userID = user.userID;
  const roomCode = user.roomCode;
  const displayName = user.displayName;
  const presenter = location.state?.presenter;
  const pretID = presenter ? presenter.userID : null;
  const isPret = pretID === userID;
  const isAdmin = user.isAdmin;
  const fieldName = location.state?.selectedField;

  const [instructionPopup, setInstructionPopup] = useState(false);

  // If first time to this page, pop up instruction
  useEffect(() => {
    const pageVisited = localStorage.getItem("geoguesserVisited");

    if (pageVisited !== "true") {
      setInstructionPopup(true);

      // Mark the user as visited to prevent showing the popup again
      localStorage.setItem("geoguesserVisited", "true");
    }
  }, []);

  useEffect(() => {
    const notifyServerOnUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";

      const confirmationMessage = "Are you sure you want to leave?";
      event.returnValue = confirmationMessage;
      return confirmationMessage;
    };

    window.addEventListener("beforeunload", notifyServerOnUnload);

    return () => {
      window.removeEventListener("beforeunload", notifyServerOnUnload);
    };
  }, []);

  const handleApiLoaded = (map: google.maps.Map, maps: typeof google.maps) => {
    setMap(map);
    setMapsApi(maps);
    console.log("map", map);
    console.log("mapsApi", maps);

    // Find the element in the DOM
    const streetViewDiv = document.getElementById("street-view");

    // Check if the element exists
    if (streetViewDiv) {
      // Create a StreetViewPanorama instance
      const panorama = new maps.StreetViewPanorama(streetViewDiv, {
        pov: { heading: 165, pitch: 0 },
        visible: false,
        addressControl: false,
      });

      setStreetViewPanorama(panorama);
    } else {
      console.error("Street view div not found");
    }
  };

  const handleSubmitAnswer = async () => {
    if (currentMarker) {
      const lat = currentMarker?.getPosition()?.lat();
      const lng = currentMarker?.getPosition()?.lng();
      const position = `${lat}, ${lng}`;

      try {
        const response = await fetch(
          `${serverPort}/setTargetLocation?roomCode=${roomCode}&location=${position}&userID=${userID}`,
          { method: "POST" }
        );
        if (response.ok) {
          console.log("submitted position:", position);
        } else {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
      } catch (error) {
        console.error("Failed to submit location:", error);
      }
    }
  };

  const updateStreetViewAndSatelliteImage: any = useCallback((lat: any, lng: any) => {
    if (isMapInteractive && map && mapsApi && streetViewPanorama) {
      new mapsApi.StreetViewService().getPanorama(
        { location: { lat, lng }, radius: 50 },
        (data, status) => {
          if (status === mapsApi.StreetViewStatus.OK) {
            streetViewPanorama.setPosition({ lat, lng });
            streetViewPanorama.setVisible(true);
            setSatelliteImageUrl(null);
          } else {
            streetViewPanorama.setVisible(false);

            const zoom = 15;
            const imageWidth = window.innerWidth;
            const imageHeight = Math.floor(window.innerHeight / 2);
            const imageUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=5000x3000&maptype=satellite&key=${GOOGLE_MAPS_API_KEY}`;
            setSatelliteImageUrl(imageUrl);
          }
        }
      );
    }
  }, [mapsApi, streetViewPanorama]);

  const handleMapClick = (event: { lat: any; lng: any }) => {
    const { lat, lng } = event;
    if (isMapInteractive && map && mapsApi) {
      if (currentMarker) {
        currentMarker.setMap(null);
      }

      const newMarker = new mapsApi.Marker({
        position: { lat, lng },
        map: map,
      });

      setCurrentMarker(newMarker);

      const location = `${lat}, ${lng}`;

      handlePin(location);

      setHistoryMarkers((prevHistoyMarkers) => [
        ...prevHistoyMarkers,
        { lat, lng },
      ]);

      if (isPret) {
        updateStreetViewAndSatelliteImage(lat, lng);
      }
    }
  };

  const checkRoomStatus = async () => {
    try {
      const response = await fetch(
        `${serverPort}/getGeoguesserStatus?roomCode=${roomCode}`,
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("status get: ", data);
      setGeoguesserStatus(data.status);
    } catch (error) {
      console.error("Failed to fetch room status:", error);
    }
  };

  const checkUserSubmit = async () => {
    try {
      const response = await fetch(
        `${serverPort}/getUserGeoSubmission?roomCode=${roomCode}&userID=${userID}`,
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setUserSubStatus(data);
    } catch (error) {
      console.error("Failed to fetch user submit status:", error);
    }
  };

  const checkWinner = async () => {
    try {
      const response = await fetch(
        `${serverPort}/geoGuesserRank?roomCode=${roomCode}`,
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      setWinner(data.rankPerson);
      setWinnerDistance(data.rankDistance);
    } catch (error) {
      console.error("Failed to get winner:", error);
    }
  };

  const checkBacktoPresentRoom = async () => {
    const url = `${serverPort}/getPlayers?roomCode=${roomCode}`;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Room cannot be found");
      }

      const data = await response.json();

      if (data.roomStatus === RoomStatus.PRESENTING) {
        navigate("/PresentPage", {
          state: { user, presenter },
        });
      }
    } catch (error) {
      console.error("Error fetching players:", error);
    }
  };

  function parseCoordinates(coordString: string) {
    const parts = coordString.split(",").map((part) => part.trim());
    return parts.map((num) => parseFloat(num));
  }

  const fetchPresenterLocation = async () => {
    try {
      const response = await fetch(
        `${serverPort}/presenterLocation?roomCode=${roomCode}`,
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.text();
      console.log("presenter location get:", data);
      const [lat, lng] = parseCoordinates(data);
      setAnswerLocation({ lat, lng });
      updateStreetViewAndSatelliteImage(lat, lng);
      console.log("presenter location set:", { lat, lng });
    } catch (error) {
      console.error("Failed to fetch presenter's location:", error);
    }
  };

  // Fetch target word
  const fetchFieldName = async () => {
    try {
      const response = await fetch(
        `${serverPort}/geoguesserFieldName?roomCode=${roomCode}`,
        {
          method: "GET",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.text();

      console.log("field name:", data);

      if (data != "Error") {
        setSelectedField(data as keyof PresentRoomInfo);
      } else {
        console.error("Game cannot be found.");
      }
    } catch (error) {
      console.error("Error fetching field name:", error);
    }
  };

  const showAnswerLocation: any = () => {
    if (answerLocation && map && mapsApi) {
      if (answerMarker) {
        answerMarker.setMap(null);
      }

      const newMarker = new mapsApi.Marker({
        position: answerLocation,
        map: map,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/green-dot.png",
          scaledSize: new google.maps.Size(40, 40),
        },
      });
      setAnswerMarker(newMarker);
    }
  };

  const onMessageReceived = useCallback(
    (msg: any) => {
      checkRoomStatus();
      checkUserSubmit();
      checkWinner();
      checkBacktoPresentRoom();
      fetchFieldName();
      if (geoguesserStatus === GeoguesserStatus.PLAYER_CHOOSE) {
        setGuestWaitingPopup(false);
        fetchPresenterLocation();
      } else if (geoguesserStatus === GeoguesserStatus.SUBMITTED) {
        setGuestWaitingPopup(false);
        setShowSubmitPopup(false);
        setShowAllSubmitPopup(true);
        showAnswerLocation();
      }
    },
    [mapsApi, map, otherUserMarkers, displayName, presenter?.displayName, answerLocation]
  );

  const onGeoguesserMessageReceived = useCallback(
    (msg: GeoguesserMessage) => {
      // Prevent updating for the current user or the presenter.
      if (
        msg.displayName === displayName ||
        msg.displayName === presenter?.displayName
      ) {
        return;
      }
      console.log("GeoguesserMessage received", msg);

      // Parse the latitude and longitude from the received message.
      const [lat, lng] = msg.location.split(", ").map(Number);

      // Ensure the Google Maps API and the map instance are available.
      if (!mapsApi || !map) {
        console.error("Google Maps API or map instance is not available.");
        return;
      }

      // Check if a marker for this user already exists.
      let marker = otherUserMarkers.get(msg.displayName);
      if (marker) {
        // Update the existing marker's position.
        marker.setPosition(new mapsApi.LatLng(lat, lng));
      } else {
        // Create a new marker for this user.
        marker = new mapsApi.Marker({
          position: { lat, lng },
          map: map,
          title: msg.displayName,
          icon: {
            path: "M -2,0 A 2,2 0 1,1 2,0 A 2,2 0 1,1 -2,0", // SVG path for a solid circle
            fillColor: "#FF0000", // Solid fill color
            fillOpacity: 1.0, // Solid fill opacity
            strokeColor: "#FF0000", // Border color of the circle
            strokeWeight: 1, // Border width of the circle
            scale: 15, // Scale for the circle size; you might need to adjust this
          },
          label: {
            text: msg.displayName,
            color: "000000",
            fontWeight: "bold",
          },
        });

        // Store the new marker in the map for future updates.
        otherUserMarkers.set(msg.displayName, marker);
      }

      if (geoguesserStatus === GeoguesserStatus.PLAYER_CHOOSE) {
        setGuestWaitingPopup(false);
        fetchPresenterLocation();
      } else if (geoguesserStatus === GeoguesserStatus.SUBMITTED) {
        setGuestWaitingPopup(false);
        setShowSubmitPopup(false);
        setShowAllSubmitPopup(true);
        showAnswerLocation();
      }
    },
    [mapsApi, map, otherUserMarkers, displayName, presenter?.displayName, answerLocation]
  );

  // Send GeoguesserMessage to server
  const handlePin = useCallback(
    (location: string) => {
      const destination = `/app/room/${roomCode}/sendGuessing`;
      const geoguesserMessage: GeoguesserMessage = {
        roomCode,
        displayName,
        location,
      };
      sendMsg(destination, geoguesserMessage);
      console.log("send message:", geoguesserMessage);
    },
    [roomCode, displayName]
  );

  // check user sub status
  useEffect(() => {
    checkRoomStatus();
    checkUserSubmit();
    checkWinner();
    fetchFieldName();
    if (geoguesserStatus === GeoguesserStatus.PRE_CHOOSE && !isPret) {
      setGuestWaitingPopup(true);
    } else if (geoguesserStatus === GeoguesserStatus.PLAYER_CHOOSE) {
      setGuestWaitingPopup(false);
      fetchPresenterLocation();
    } else if (geoguesserStatus === GeoguesserStatus.SUBMITTED) {
      setGuestWaitingPopup(false);
      setShowSubmitPopup(false);
      setShowAllSubmitPopup(true);
      showAnswerLocation();
    }
  }, [geoguesserStatus]);

  useEffect(() => {
    if (userSubStatus && geoguesserStatus !== GeoguesserStatus.SUBMITTED) {
      setShowSubmitPopup(true);
      setIsMapInteractive(false);
    }
  }, [userSubStatus]);

  // Connect to waitroom websokect
  useEffect(() => {
    const topic = `/topic/room/${roomCode}/wait`;
    const cleanup = connect(
      socketUrl,
      websocketUrl,
      topic,
      onMessageReceived,
      setRender
    );
    return cleanup;
  }, []);

  // Connect to GeoguesserMessage websokect
  useEffect(() => {
    if (mapsApi && map) {
      const topic = `/topic/room/${roomCode}/geoguesser`;
      const cleanup = connect(
        socketUrl,
        websocketUrl,
        topic,
        onGeoguesserMessageReceived,
        setRender
      );
      return cleanup;
    }
  }, [mapsApi, map]);

  // set presenter location
  useEffect(() => {
    if (answerLocation) {
      updateStreetViewAndSatelliteImage(answerLocation.lat, answerLocation.lng);
      console.log("streetview set");
    }
  }, [answerLocation, updateStreetViewAndSatelliteImage]);

  // When click back to presenet room button
  const handleBackButton = async () => {
    // Change room status
    const url = `${serverPort}/backToPresentRoom?roomCode=${roomCode}`;
    try {
      const response = await fetch(url, {
        method: "POST",
      });
      if (!response.ok) {
        console.log(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error returning to PresentRoom:", error);
    }

    // Update PresentRoomInfo
    if (selectedField) {
      updatePresentRoomInfo({ roomCode, field: selectedField });
    }
  };

  // When click choose another game button
  const handleChooseAnotherGame = async () => {
    // Change room status
    const url = `${serverPort}/backToPresentRoom?roomCode=${roomCode}`;
    try {
      const response = await fetch(url, {
        method: "POST",
      });
      if (!response.ok) {
        console.log(`HTTP error! Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error returning to PresentRoom:", error);
    }
  };

  return render ? (
    <div className="page" style={{ alignItems: "flex-start" }}>
      <div
        className="top-bar"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          width: "100%",
        }}
      >
        <div className="row-container top-left" style={{ marginLeft: "5%" }}>
          {/* Timer */}
          <Instructions instructionPics={geoguesserInstructions} />
          <div>
            <Timer
              user={user}
              roomCode={roomCode}
              roomStatus={RoomStatus.PRESENTING}
              defaultTime={60}
            />
          </div>
        </div>
        <h1 className="header-title">
          We are guessing {presenter.displayName}'s {selectedField}
        </h1>
      </div>

      <div className="content-container">
        <div className="street-view-section">
          <h2>Referenced Street View</h2>
          <div className="street-view-container" id="street-view">
            {satelliteImageUrl ? (
              <img src={satelliteImageUrl} alt="Satellite Image" />
            ) : null}
          </div>
        </div>

        <div className="map-section">
          <h2>Choose Your Guess Point on Map</h2>
          <div className="map-container">
            <GoogleMapReact
              bootstrapURLKeys={{
                key: GOOGLE_MAPS_API_KEY,
                libraries: ["places", "geometry", "drawing", "visualization"],
              }}
              defaultCenter={{ lat: 0, lng: 0 }}
              defaultZoom={2}
              yesIWantToUseGoogleMapApiInternals
              onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)}
              onClick={handleMapClick}
            />
          </div>
        </div>
      </div>

      <div className="column-container buttons-container">
        <button
          className="button common-button"
          style={{ justifyContent: "center" }}
          onClick={handleSubmitAnswer}
          disabled={showSubmitPopup || showAllSubmitPopup}
        >
          Submit Answer
        </button>

        {isAdmin && (
          <button
            className="button admin-only-button"
            style={{ zIndex: "var(--above-overlay-index)" }}
            onClick={handleChooseAnotherGame}
          >
            Choose Another Game
          </button>
        )}
      </div>

      {/* Single Player Submitted popup */}
      {showSubmitPopup && (
        <div className="popup">
          <h3>You have submitted your answer!</h3>
          <p>Now please wait for others!</p>
        </div>
      )}

      {/* AllPlayers Submitted popup */}
      {showAllSubmitPopup && (
        <div className="popup">
          <h3>All finished!</h3>
          <h3>The results are:</h3>
          <ul>
            {winner.map((winnerProfile, index) => {
              const distance = winnerDistance[index].toFixed(2);
              return (
                <li key={index}>
                  {winnerProfile.displayName} : {distance}km away
                </li>
              );
            })}
          </ul>
          {isAdmin && (
            <button
              className="button admin-only-button"
              onClick={handleBackButton}
              style={{ zIndex: "var(--above-overlay-index)" }}
            >
              Back to Present Room
            </button>
          )}
        </div>
      )}

      {/* Guests Waiting popup */}
      {guestWaitingPopup && (
        <div className="waiting-popup">
          <div className="waiting-popup-inner">
            <h3>The presenter is choosing a location, please wait.</h3>
          </div>
        </div>
      )}

      {/* First time instruction popup */}
      {instructionPopup && (
        <Instructions
          instructionPics={geoguesserInstructions}
          onlyShowPopup={true}
          closeButtonFunction={() => setInstructionPopup(false)}
        />
      )}
    </div>
  ) : (
    <></>
  );
};

export default GeoguesserPage;
