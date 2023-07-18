// Header.jsx
import React from 'react';
import logo from '../../assets/svgs/logo.svg';
import './style.css';

const Header = () => (
  <div className="logo-container">
    <img src={logo} alt="Logo" />
  </div>
);

export default Header;