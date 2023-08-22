/**
 * src/components/Header/index.jsx
 * logo
 *
 * created by Lynchee on 7/16/23
 */

import React from 'react';
import logo from '../../assets/svgs/logo.svg';
import './style.css';
import SignIn from '../Auth/SignIn';
import SignOut from '../Auth/SignOut';
import {
  Navbar, 
  NavbarBrand, 
  NavbarContent, 
} from "@nextui-org/navbar";

import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@nextui-org/dropdown";

import {Avatar} from "@nextui-org/avatar";

import { Link } from 'react-router-dom';

const Header = ({ user, isLoggedIn, setToken, handleDisconnect }) => (
  <Navbar id='navbar' variant="floating">
  <NavbarBrand>
  <Link to="/">
  <img src={logo} alt='Logo' />
  </Link>
  </NavbarBrand>

  <NavbarContent as="div" justify="end">
  {user ? (
        <SignOut
          isLoggedIn={isLoggedIn}
          user={user}
          handleDisconnect={handleDisconnect}
        />
      ) : (
        <SignIn isLoggedIn={isLoggedIn} setToken={setToken} />
      )}
  </NavbarContent>
</Navbar>
);

export default Header;
