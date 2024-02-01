import React, { useState } from 'react';
import GoogleMapReact from 'google-map-react';
import "./css/Geoguesser.css";

const GOOGLE_MAPS_API_KEY = 'AIzaSyDENKVeABbLKd8DG_8H0RJLeh7y4FBqrUs';

const GeoguesserPage: React.FC = () => {
  const [map, setMap] = useState<google.maps.Map>();
  const [mapsApi, setMapsApi] = useState<typeof google.maps>();
  const [markers, setMarkers] = useState<{lat: number, lng: number}[]>([]);


  const handleApiLoaded = (map: google.maps.Map, maps: typeof google.maps) => {
    setMap(map);
    setMapsApi(maps);
  };

  const handleMapClick = (event: { lat: any; lng: any; }) => {
    const { lat, lng } = event;
    if (map && mapsApi) {
      new mapsApi.Marker({
        position: { lat, lng },
        map: map
      });

      setMarkers(prevMarkers => [
        ...prevMarkers,
        { lat, lng }
      ]);
    } 
  };

  return (
    <div >
      <h1>GeoGuessr</h1>
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
        <h2>Markers:</h2>
        <ul>
          {markers.map((marker, index) => (
            <li key={index}>Marker {index + 1}: ({marker.lat}, {marker.lng})</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default GeoguesserPage;
