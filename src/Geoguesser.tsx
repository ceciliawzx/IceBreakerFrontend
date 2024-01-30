import React, { useState } from 'react';
import GoogleMapReact from 'google-map-react';
import Marker from './Marker';

// Replace 'YOUR_API_KEY' with your actual Google Maps API key
const GOOGLE_MAPS_API_KEY = 'AIzaSyDENKVeABbLKd8DG_8H0RJLeh7y4FBqrUs';

interface Pin {
    lat: number;
    lng: number;
}

const GeoguesserPage: React.FC = () => {
    const [pins, setPins] = useState<Pin[]>([]);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const handleMapClick = (event: google.maps.MapMouseEvent) => {
        if (map) {
            const newPin: Pin = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
            };

            setPins((prevPins) => [...prevPins, newPin]);
        }
    };

    const handleApiLoad = (map: google.maps.Map) => {
        setMap(map);
        map.addListener('click', handleMapClick);
    };

    return (
        <div>
            <h1>GeoGuessr</h1>
            <div style={{ width: '100%', height: '500px' }}>
                <GoogleMapReact
                    bootstrapURLKeys={{ key: GOOGLE_MAPS_API_KEY }}
                    defaultCenter={{ lat: 0, lng: 0 }}
                    defaultZoom={2}
                    yesIWantToUseGoogleMapApiInternals
                    onGoogleApiLoaded={({ map }) => handleApiLoad(map)}
                >
                    {pins.map((pin, index) => (
                        <Marker
                            key={index}
                            lat={pin.lat}
                            lng={pin.lng}
                            text={`Pin ${index + 1}`}
                        />
                    ))}
                </GoogleMapReact>
            </div>
            <div>
                <h2>Pins:</h2>
                <ul>
                    {pins.map((pin, index) => (
                        <li key={index}>
                            Latitude: {pin.lat}, Longitude: {pin.lng}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default GeoguesserPage;
