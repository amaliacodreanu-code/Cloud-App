import React from "react";
import { Button, Container, Nav, Navbar } from "react-bootstrap";

const CustomNavbar = () => {
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = "/login";
    }

    return (
        <Navbar bg="dark" data-bs-theme="dark">
            <Container>
                <Navbar.Brand href="/home">Drinks Review</Navbar.Brand>
                <Nav className="me-auto">
                    <Nav.Link key="home" href="/home">Home</Nav.Link>
                    <Nav.Link key="discover" href="/discover">Discover</Nav.Link>
                    <Nav.Link key="search" href="/search">Search</Nav.Link>
                    <Nav.Link key="profile" href="/profile">Profile</Nav.Link>
                </Nav>
                <Nav>
                    <Nav.Link key="logout" href="/login">
                        <Button variant="danger" onClick={handleLogout}>
                            Logout
                        </Button>
                    </Nav.Link>
                </Nav>
            </Container>
        </Navbar>
    );
};

export default CustomNavbar;
