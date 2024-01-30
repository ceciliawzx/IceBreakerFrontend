import React, { useState } from 'react';
import GoogleMapReact from 'google-map-react';
import Marker from './Marker';

const GOOGLE_MAPS_API_KEY = 'YOUR_API_KEY'; // Replace with your actual Google Maps API key

interface Pin {
    lat: number;
    lng: number;
}

const GeoguesserPage: React.FC = () => {
    const [pins, setPins] = useState<Pin[]>([]);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [pinMode, setPinMode] = useState<boolean>(false);
    const [selectedLocation, setSelectedLocation] = useState<Pin | null>(null);

    const handleMapClick = (event: google.maps.MapMouseEvent) => {
        if (pinMode && map) {
            const newPin: Pin = {
                lat: event.latLng.lat(),
                lng: event.latLng.lng(),
            };
            setPins((prevPins) => [...prevPins, newPin]);
            setSelectedLocation(newPin);
        }
    };

    const togglePinMode = () => {
        setPinMode((prevPinMode) => !prevPinMode);
        setSelectedLocation(null);
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
                <button onClick={togglePinMode}>
                    {pinMode ? 'Disable Pin Mode' : 'Enable Pin Mode'}
                </button>
            </div>
            {selectedLocation && (
                <div>
                    <h2>Selected Location:</h2>
                    <p>Latitude: {selectedLocation.lat}</p>
                    <p>Longitude: {selectedLocation.lng}</p>
                </div>
            )}
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
