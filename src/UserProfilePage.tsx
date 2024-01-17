import React, { useState } from 'react';
import './UserProfilePage.css';

const UserProfilePage = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [city, setCity] = useState('');
    const [country, setCountry] = useState('');
    const [selfie, setSelfie] = useState<File | null>(null);

    const handleSelfieChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            setSelfie(event.target.files[0]);
        }
    };


    return (
        <div className="user-profile-container">
            <h2 className="form-title">Please enter your details</h2>
            <form className="form">
                <div className="form-row">
                    <label>First Name:</label>
                    <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} />
                </div>
                <div className="form-row">
                    <label>Last Name:</label>
                    <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} />
                </div>
                <div className="form-row">
                    <label>City:</label>
                    <input type="text" value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div className="form-row">
                    <label>Country:</label>
                    <input type="text" value={country} onChange={e => setCountry(e.target.value)} />
                </div>
                <div className="form-row">
                    <label>Selfie:</label>
                    <input type="file" onChange={handleSelfieChange} accept="image/*" />
                </div>
                
            </form>
            <button type="submit" className="submit-button">Submit</button>
        </div>
    );
};

export default UserProfilePage;
