/**
 * src/components/Common/IconButton.jsx
 * A general-purpose Icon Button component
 * 
 * created by Lynchee on 7/19/23
 */

import React from 'react';
import './styles.css';

const IconButton = ({ Icon, className, onClick, bgcolor="default", disabled=false}) => {
  return (
    <div className={`icon-button ${className} ${bgcolor} ${disabled ? "disabled" : ""}`} 
         onClick={disabled ? null : onClick}>
      <Icon className="icon-instance-node-small" />
    </div>
  );
};

export default IconButton;
