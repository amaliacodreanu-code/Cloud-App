import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../images/logo.png';
import '../styles/Login.css';
import { Alert, Button, Col, Container, Form, Row } from 'react-bootstrap';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const apiUrl = window.__ENV__["VITE_AUTH_URL"];

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Check if the form inputs are empty
        var inputs = document.querySelectorAll('input');
        var isValid = true;

        inputs.forEach((input) => {
            if (input.type !== 'submit' && input.value.trim() === '') {
                setError('Please fill out the ' + input.id + ' field.');
                isValid = false;
                input.focus();
                return false;
            }
        });

        if (isValid) {
            try {
                const response = await fetch(`${apiUrl}/login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                if (!response.ok) {
                    throw new Error('Invalid username or password');
                }


                const data = await response.json();

                localStorage.setItem('token', data.access_token);
                localStorage.setItem('username', username);

                navigate('/home');
            } catch (error) {
                setError('Invalid username or password');
                console.error('Error logging in:', error);
            }
        }

    }

    return (
        <Container className='login-container'>
            <Row className="justify-content-center">
                <Col xs={12} md={4}>
                    <div className="text-center mb-4">
                        <img src={logo} alt="Logo" className='img-fluid'></img>
                    </div>
                    <Form onSubmit={handleSubmit}>
                        <Form.Group controlId="username" className="mb-3">
                            <Form.Label>Username</Form.Label>
                            <Form.Control
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                            />
                        </Form.Group>
                        <Form.Group controlId="password" className="mb-3">
                            <Form.Label>Password</Form.Label>
                            <Form.Control
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </Form.Group>
                        {error && <Alert variant="danger">{error}</Alert>}
                        <Button variant="primary" type="submit" className="w-100">Sign In</Button>
                    </Form>
                    <div className="text-center mt-3">
                        <p>
                            New around here? <a href='/register'>Sign up!</a>
                        </p>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default Login;
