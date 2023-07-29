/**
 * src/components/Languages/index.jsx
 * Select a language: currently support English or Spanish
 * 
 * created by pycui on 7/28/23
 */

import React from 'react';
import './style.css'

const Languages = ({preferredLanguage, setPreferredLanguage}) => {
    const languages = ["English", "Spanish"];

    return (
        <div className="languages-container">
            <label className="languages-label" htmlFor="languages-selection">Language</label>
            <div id="languages-selection" className="select-dropdown">
                <select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)}>
                    <option disabled value="">Select Language</option>
                    {languages.map((language, index) => <option key={index} value={language}>{language}</option>)}
                </select>
            </div>
        </div>
    )
}

export default Languages;
