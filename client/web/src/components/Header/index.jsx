/**
 * src/components/Header/index.jsx
 * logo
 * 
 * created by Lynchee on 7/16/23
 */

import React from 'react';
import logo from '../../assets/svgs/logo.svg';
import './style.css';

const Header = () => (
  <header>
    <img src={logo} alt="Logo" />
  </header>
);

export default Header;