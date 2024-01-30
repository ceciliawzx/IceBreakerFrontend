import React from 'react';

interface MarkerProps {
    lat: number;
    lng: number;
    text: string;
}

const Marker: React.FC<MarkerProps> = ({ lat, lng, text }) => (
    <div
        style={{
            position: 'absolute',
            background: 'red',
            color: 'white',
            padding: '5px 10px',
            borderRadius: '50%',
            transform: 'translate(-50%, -50%)',
            left: `${lng}%`,
            top: `${lat}%`,
        }}
    >
        {text}
    </div>
);

export default Marker;
