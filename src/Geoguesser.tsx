import React, { useState,useEffect } from 'react';
import GoogleMapReact from 'google-map-react';
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { serverPort } from "./macro/MacroServer";
import { refreshTime } from "./macro/MacroConst";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import "./css/Geoguesser.css";

enum GeoguesserStatus {
  PRE_CHOOSE = "PRE_CHOOSE",
  PLAYER_CHOOSE = "PLAYER_CHOOSE",
  SUBMITTED = "SUBMITTED"
}

const GOOGLE_MAPS_API_KEY = 'AIzaSyDENKVeABbLKd8DG_8H0RJLeh7y4FBqrUs';

const GeoguesserPage: React.FC = () => {
  const [map, setMap] = useState<google.maps.Map>();
  const [mapsApi, setMapsApi] = useState<typeof google.maps>();
  const [historyMarkers, setHistoryMarkers] = useState<{lat: number, lng: number}[]>([]);
  const [currentMarker, setCurrentMarker] = useState<google.maps.Marker | null>(null);
  const [showSubmitPopup, setShowSubmitPopup] = useState(false);
  const [isMapInteractive, setIsMapInteractive] = useState(true);
  const [guestWaitingPopup, setGuestWaitingPopup] = useState(false);
  const [geoguesserStatus, setGeoguesserStatus] = useState<GeoguesserStatus>();
  const [showAllSubmitPopup, setShowAllSubmitPopup] = useState(false);
  const [userSubStatus, setUserSubStatus] = useState(false);
  const [streetViewPanorama, setStreetViewPanorama] = useState<google.maps.StreetViewPanorama>();
  const [winner, setWinner] = useState<UserProfile[]>([]);
  const [winnerDistance, setWinnerDistance] = useState<number[]>([]);

  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const userID = user.userID;
  const roomCode = user.roomCode;
  const displayName = user.displayName;
  const presenter = location.state?.presenter;
  const pretID = presenter ? presenter.userID : null;
  const isPret = (pretID === userID);

  const handleApiLoaded = (map: google.maps.Map, maps: typeof google.maps) => {
    setMap(map);
    setMapsApi(maps);

    // Find the element in the DOM
    const streetViewDiv = document.getElementById('street-view');

    // Check if the element exists
    if (streetViewDiv) {
      // Create a StreetViewPanorama instance
      const panorama = new maps.StreetViewPanorama(
        streetViewDiv,
        {
          position: { lat: 0, lng: 0 }, // default position or hide it initially
          pov: { heading: 165, pitch: 0 },
          visible: false, // set to false if you want to hide it initially
        }
      );

      setStreetViewPanorama(panorama);
    } else {
      console.error('Street view div not found');
    }
  };

  const handleSubmitAnswer = async () => {
    if (currentMarker) {
      const lat = currentMarker?.getPosition()?.lat().toFixed(3);
      const lng = currentMarker?.getPosition()?.lng().toFixed(3);
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
  }

  const handleMapClick = (event: { lat: any; lng: any; }) => {
    const { lat, lng } = event;
    if (isMapInteractive && map && mapsApi && streetViewPanorama) {

      if (currentMarker) {
        currentMarker.setMap(null);
      }

      const newMarker = new mapsApi.Marker({
        position: { lat, lng },
        map: map
      });

      setCurrentMarker(newMarker);

      setHistoryMarkers(prevHistoyMarkers => [
        ...prevHistoyMarkers,
        { lat, lng }
      ]);

      // Check for Street View availability at the clicked location
      new mapsApi.StreetViewService().getPanorama({ location: { lat, lng }, radius: 50 }, (data, status) => {
        if (status === mapsApi.StreetViewStatus.OK) {
          streetViewPanorama.setPosition({ lat, lng });
          streetViewPanorama.setVisible(true);
        } else {
          // No Street View available, so show satellite image
          map.setMapTypeId(mapsApi.MapTypeId.SATELLITE);
          // Optionally, you might want to inform the user that no Street View is available
        }
      });
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
      setGeoguesserStatus(data.status);
      console.log("status set:", geoguesserStatus);
      
    } catch (error) {
      console.error("Failed to fetch room status:", error);
    }
  }

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
  }

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
      console.log("dataget:", data, "winner set:", winner, "winner distance set:", winnerDistance);

    } catch (error) {
      console.error("Failed to get winner:", error);
    }
  }

  // Periodically check room status
  useEffect(() => {
    checkRoomStatus();
    checkUserSubmit();
    checkWinner();
    if (userSubStatus) {
      setShowSubmitPopup(true);
      setIsMapInteractive(false); 
    }
    if ((geoguesserStatus === GeoguesserStatus.PRE_CHOOSE) && !isPret) {
      setGuestWaitingPopup(true);
    } else if (geoguesserStatus === GeoguesserStatus.PLAYER_CHOOSE) {
      setGuestWaitingPopup(false);
    } else if (geoguesserStatus === GeoguesserStatus.SUBMITTED) {

      setShowSubmitPopup(false);
      setShowAllSubmitPopup(true);
    }

    const interval = setInterval(() => {
      checkRoomStatus();
      checkUserSubmit();
      checkWinner();
      if (userSubStatus) {
        setShowSubmitPopup(true);
        setIsMapInteractive(false); 
      }
      if ((geoguesserStatus === GeoguesserStatus.PRE_CHOOSE) && !isPret) {
        setGuestWaitingPopup(true);
      } else if (geoguesserStatus === GeoguesserStatus.PLAYER_CHOOSE) {
        setGuestWaitingPopup(false);
      } else if (geoguesserStatus === GeoguesserStatus.SUBMITTED) {
        setShowSubmitPopup(false);
        setShowAllSubmitPopup(true);
      }
    }, refreshTime); // Assuming 'refreshTime' is a predefined interval time

    return () => clearInterval(interval);
  }, [geoguesserStatus, userSubStatus, winner]);
  

  return (
    <div >
      <h1 className="header-title">
        Welcome to Geoguesser, {displayName}!
      </h1>
      <div className="map-container">
        <GoogleMapReact
          bootstrapURLKeys={{ 
            key: GOOGLE_MAPS_API_KEY,
            libraries: ['places', 'geometry', 'drawing', 'visualization']
          }}
          defaultCenter={{ lat: 0, lng: 0 }}
          defaultZoom={2}
          yesIWantToUseGoogleMapApiInternals
          onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)}
          onClick={handleMapClick}
        />
      </div>
      <button className="common-button" onClick={handleSubmitAnswer}>
          Submit Answer
        </button>

      <div className="street-view-container" id="street-view" style={{ height: '400px', width: '100%' }}>
        {/* Street View will be rendered here */}
      </div>
    
    {/* Single Player Submitted popup */}
    {showSubmitPopup  &&(
      <div className="waiting-popup">
      <div className="waiting-popup-inner">
        <h3>You have submitted your answer!</h3>
        {/* <p>Location: ({currentMarker?.getPosition()?.lat().toFixed(3)}, {currentMarker?.getPosition()?.lng().toFixed(3)})</p> */}
        <p>Now please wait for others!</p>
      </div>
    </div>
    )}

    {/* AllPlayers Submitted popup */}
    {showAllSubmitPopup &&(
      <div className="waiting-popup">
      <div className="waiting-popup-inner">
        <h3>All finished!</h3>
        <h3>The winners are:</h3>
          <ul>
            {winner.map((winnerProfile, index) => {
                const distance = winnerDistance[index];
                return (
                    <li key={index}>
                        {winnerProfile.displayName}
                    </li>
                );
            })}
        </ul>
      </div>
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

    </div>
  );
};

export default GeoguesserPage;
