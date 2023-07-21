/**
 * src/components/Models/index.jsx
 * Select a model: gpt3.5, gpt4, or claude
 * 
 * created by Lynchee on 7/20/23
 */

import React from 'react';
import './style.css'

const Models = ({selectedModel, setSelectedModel}) => {
    const models = ["gpt-3.5-turbo-16k", "gpt-4", "claude-2"];

    return (
        <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
            <option disabled value="">Select Model</option>
            {models.map((model, index) => <option key={index} value={model}>{model}</option>)}
        </select>
    )
}

export default Models