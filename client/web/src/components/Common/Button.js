import React from 'react';
import './styles.css';

const Button = ({ onClick, name, disabled = false }) => (
    <button className="button" onClick={onClick} disabled={disabled}>
        {name}
    </button>
);

export default Button;
