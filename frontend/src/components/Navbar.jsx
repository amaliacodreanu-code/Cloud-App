import React from "react";
import { Button, Container, Nav, Navbar } from "react-bootstrap";
import "../styles/Navbar.css";
import logo from "../images/logo.png";

const CustomNavbar = () => {
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <Navbar expand="lg" className="app-navbar" variant="dark">
      <Container>
        <Navbar.Brand href="/home" className="app-navbar-brand">
          <img src={logo} alt="Drinks Review" className="app-navbar-logo" />
          <span>Drinks Review</span>
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="main-navbar" className="app-navbar-toggle" />

        <Navbar.Collapse id="main-navbar">
          <Nav className="me-auto app-navbar-links">
            <Nav.Link href="/home" className="app-nav-link">
              Home
            </Nav.Link>
            <Nav.Link href="/discover" className="app-nav-link">
              Discover
            </Nav.Link>
            <Nav.Link href="/search" className="app-nav-link">
              Search
            </Nav.Link>
            <Nav.Link href="/recommendations" className="app-nav-link">
              Recommendations
            </Nav.Link>
            <Nav.Link href="/profile" className="app-nav-link">
              Profile
            </Nav.Link>
          </Nav>

          <Nav className="app-navbar-actions">
            <Button type="button" className="app-logout-btn" onClick={handleLogout}>
              Logout
            </Button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default CustomNavbar;
