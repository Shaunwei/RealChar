// Characters
import React, { useEffect, useState } from 'react';
import './style.css';
import raiden from '../../assets/svgs/raiden.svg';
import loki from '../../assets/svgs/loki.svg';
import aiHelper from '../../assets/images/ai_helper.png';
import pi from '../../assets/images/pi.jpeg';
import elon from '../../assets/images/elon.png';
import bruce from '../../assets/images/bruce.png';
import steve from '../../assets/images/jobs.png';
import realchar from '../../assets/svgs/realchar.svg';

// character groups
const createCharacterGroups = (message) => {
    const options = message.split('\n').slice(1);

    const imageMap = {
        'Raiden Shogun And Ei': raiden,
        'Loki': loki,
        'Ai Character Helper': aiHelper,
        'Reflection Pi': pi,
        'Elon Musk': elon,
        'Bruce Wayne': bruce,
        'Steve Jobs': steve,
    };

    const newCharacterGroups = [];
    options.forEach(option => {
        const match = option.match(/^(\d+)\s-\s(.+)$/);
        if (match) {
            let src = imageMap[match[2]];
            if (!src) {
                src = {realchar};
            }
            
            newCharacterGroups.push({
            id: match[1],
            name: match[2],
            imageSrc: src
            });
        }
    });

    return newCharacterGroups;
}

const Characters = ({ characterGroups, selectedCharacter, setSelectedCharacter, isPlaying, characterConfirmed }) => {
    const [pulseAnimation, setPulseAnimation] = useState(null);

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
                    (!characterConfirmed || group.id === selectedCharacter) && (
                    <label key={group.id} className={`custom-radio ${group.id === selectedCharacter ? pulseAnimation : ''}`}>
                        <input 
                            type='radio' 
                            name='radio' 
                            value={group.id} 
                            onChange={handleCharacterSelection}
                        />
                        <span className='radio-btn'>
                            <div className='hobbies-icon'>
                                <img src={group.imageSrc} alt={group.name}/>
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
  
export { Characters, createCharacterGroups };