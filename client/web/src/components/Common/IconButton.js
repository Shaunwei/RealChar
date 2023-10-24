/**
 * src/components/Common/IconButton.jsx
 * A general-purpose Icon Button component
 *
 * created by Lynchee on 7/19/23
 */

import React from 'react';
import './styles.css';

const IconButton = ({
  Icon,
  className,
  onClick,
  bgcolor = 'default',
  disabled = false,
  sp = false,
}) => {
  return (
    <div
      className={`icon-button ${className} ${bgcolor} ${
        disabled ? 'disabled' : ''
      }`}
      style={{ marginRight: sp ? '10px' : '0px' }}
      onClick={disabled ? null : onClick}
    >
      <Icon className='icon-instance-node-small' />
    </div>
  );
};

export default IconButton;
