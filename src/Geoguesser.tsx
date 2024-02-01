import React, { useState } from 'react';
import GoogleMapReact from 'google-map-react';
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { serverPort } from "./macro/MacroServer";
import { refreshTime } from "./macro/MacroConst";
import { User } from "./type/User";
import { UserProfile } from "./type/UserProfile";
import "./css/Geoguesser.css";

const GOOGLE_MAPS_API_KEY = 'AIzaSyDENKVeABbLKd8DG_8H0RJLeh7y4FBqrUs';

const GeoguesserPage: React.FC = () => {
  const [map, setMap] = useState<google.maps.Map>();
  const [mapsApi, setMapsApi] = useState<typeof google.maps>();
  const [historyMarkers, setHistoryMarkers] = useState<{lat: number, lng: number}[]>([]);
  const [currentMarker, setCurrentMarker] = useState<google.maps.Marker | null>(null);

  const location = useLocation();
  const navigate = useNavigate();
  const user = location.state?.user;
  const userID = user.userID;
  const roomCode = user.roomCode;
  const displayName = user.displayName;
  const presenter = location.state?.presenter;
  const admin = location.state?.admin;
  const guests = location.state?.guests;


  const handleApiLoaded = (map: google.maps.Map, maps: typeof google.maps) => {
    setMap(map);
    setMapsApi(maps);
  };

  const handleMapClick = (event: { lat: any; lng: any; }) => {
    const { lat, lng } = event;
    if (map && mapsApi) {

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
    } 
  };

  return (
    <div >
      <h1>
        Welcome to Geoguesser, {displayName}!
      </h1>
      <div className="map-container">
        <GoogleMapReact
          bootstrapURLKeys={{ key: GOOGLE_MAPS_API_KEY }}
          defaultCenter={{ lat: 0, lng: 0 }}
          defaultZoom={2}
          yesIWantToUseGoogleMapApiInternals
          onGoogleApiLoaded={({ map, maps }) => handleApiLoaded(map, maps)}
          onClick={handleMapClick}
        />
      </div>
      <div className="marker-list">
        <h2>Marker History:</h2>
        <ul>

          {historyMarkers.map((marker, index) => (
            <li key={index}>Marker {index + 1}: ({marker.lat}, {marker.lng})</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GeoguesserPage;
