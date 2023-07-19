/**
 * src/components/Common/Button.jsx
 * A general-purpose Button component
 * 
 * created by Lynchee on 7/18/23
 */

import React from 'react';
import './styles.css';

const Button = ({ onClick, name, disabled = false }) => (
    <button className="button" onClick={onClick} disabled={disabled}>
        {name}
    </button>
);

export default Button;
