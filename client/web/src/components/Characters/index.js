/**
 * src/components/Characters/index.jsx
 * create and display characters
 * 
 * created by Lynchee on 7/16/23
 */

// Characters
import React, { useEffect, useState } from 'react';
import './style.css';

const Characters = ({ characterGroups, selectedCharacter, setSelectedCharacter, isPlaying, characterConfirmed }) => {
    const [pulseAnimation, setPulseAnimation] = useState(null);

    // when the character is talking, show animation 
    useEffect(() => {
        if (isPlaying) {
            setPulseAnimation(Math.random() > 0.5 ? "pulse-animation-1" : "pulse-animation-2");
        } else {
            setPulseAnimation(null);
        }
    }, [isPlaying]);

    const handleCharacterSelection = (e) => {
        setSelectedCharacter(e.target.value);
    };

    return (
        <div className="main-container">
            <div className='radio-buttons'>
                {characterGroups.map(group => (
                    (!characterConfirmed || group.character_id === selectedCharacter) && (
                    <label key={group.character_id} className="custom-radio">
                        <input 
                            type='radio' 
                            name='radio' 
                            value={group.character_id} 
                            onChange={handleCharacterSelection}
                        />
                        <span className={`radio-btn ${group.character_id === selectedCharacter ? pulseAnimation : ''}`}>
                            <div className='hobbies-icon'>
                                <img src={group.image_url} alt={group.name}/>
                                <h4>{group.name}</h4>
                            </div>
                        </span>
                    </label>
                    )
                ))}
            </div>
        </div>
    )
}
  
export default Characters;
