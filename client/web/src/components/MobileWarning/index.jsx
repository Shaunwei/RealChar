/**
 * src/components/MobileWarning/index.jsx
 * Show warning when user opens the website on mobile browser,
 * 
 * created by Lynchee on 7/16/23
 */

import React from 'react';
import './style.css'

const MobileWarning = () => (
  <div id="mobile-warning">
    <p>This website is best viewed on a desktop browser.</p>
    <p>Please switch to a desktop for the best experience.</p>
    <p>Mobile version is coming soon!</p>
    <p>If you have an iOS device, you can test our {" "}
       <a href='https://testflight.apple.com/join/JA6p9sZQ' style={{color: 'green'}}>iOS beta app</a>
    </p>
  </div>
);

export default MobileWarning;
