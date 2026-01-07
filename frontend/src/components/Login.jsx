import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../images/logo.png";
import "../styles/Auth.css";
import { Alert, Button, Col, Container, Form, Modal, Row } from "react-bootstrap";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const navigate = useNavigate();
  const apiUrl = window.__ENV__["VITE_AUTH_URL"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const inputs = document.querySelectorAll("input");
    let isValid = true;

    inputs.forEach((input) => {
      if (input.type !== "submit" && input.value.trim() === "") {
        setError("Te rog completează câmpul: " + input.id + ".");
        isValid = false;
        input.focus();
        return false;
      }
    });

    if (!isValid) return;

    try {
      const response = await fetch(`${apiUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) throw new Error("Invalid username or password");

      const data = await response.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("username", username);
      navigate("/home");
    } catch (err) {
      setError("Nume de utilizator sau parolă incorecte.");
      console.error("Error logging in:", err);
    }
  };

  return (
    <div className="dr-auth">
      <Container className="dr-auth-shell">
        <Row className="justify-content-center">
          <Col xs={12} md={5} lg={4}>
            <div className="dr-auth-card">
              <div className="text-center mb-4">
                <img src={logo} alt="DrinksReview logo" className="dr-auth-logo" />
                <div className="dr-auth-title">Autentificare</div>
              </div>

              <Form onSubmit={handleSubmit}>
                <Form.Group controlId="username" className="mb-3">
                  <Form.Label>Nume utilizator</Form.Label>
                  <Form.Control
                    className="dr-auth-input"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </Form.Group>

                <Form.Group controlId="password" className="mb-3">
                  <Form.Label>Parolă</Form.Label>
                  <Form.Control
                    className="dr-auth-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </Form.Group>

                {error && (
                  <Alert className="dr-auth-alert" variant="danger">
                    {error}
                  </Alert>
                )}

                <Button className="dr-auth-btn w-100" type="submit">
                  Intră în cont
                </Button>
              </Form>

              <div className="text-center mt-3 dr-auth-foot">
                Ești nou aici? <a href="/register">Creează un cont</a>
              </div>

              <div className="text-center mt-3 dr-auth-legal">
                Trebuie să ai vârsta legală pentru consumul de alcool în țara ta pentru a folosi DrinksReview. Prin
                continuare, accepți{" "}
                <button type="button" className="dr-link" onClick={() => setShowTerms(true)}>
                  Termenii de utilizare
                </button>{" "}
                și{" "}
                <button type="button" className="dr-link" onClick={() => setShowPrivacy(true)}>
                  Politica de confidențialitate
                </button>
                .
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      <Modal show={showTerms} onHide={() => setShowTerms(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Termeni de utilizare</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            DrinksReview este o platformă educațională și socială pentru recenzii și recomandări de băuturi. Folosind
            aplicația, ești de acord să o utilizezi legal, cu bun simț și fără a publica conținut dăunător.
          </p>
          <ul>
            <li>Nu publica informații personale despre alte persoane fără acord.</li>
            <li>Nu publica conținut ofensator, discriminatoriu, violent sau ilegal.</li>
            <li>Nu încerca să accesezi conturi sau date care nu îți aparțin.</li>
            <li>Recenziile sunt opinii ale utilizatorilor, nu recomandări medicale sau de consum.</li>
          </ul>
          <p>
            Administratorii își rezervă dreptul de a modera sau elimina conținutul și de a restricționa accesul în cazul
            încălcării acestor reguli.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTerms(false)}>
            Închide
          </Button>
        </Modal.Footer>
      </Modal>

      <Modal show={showPrivacy} onHide={() => setShowPrivacy(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Politica de confidențialitate</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Colectăm și folosim date strict pentru funcționarea aplicației.</p>
          <ul>
            <li>Date cont: nume de utilizator, parolă (stocată securizat de backend, nu în clar).</li>
            <li>Date de sesiune: token de autentificare salvat local pentru acces (localStorage).</li>
            <li>Conținut: recenzii, evaluări și informații pe care le publici în aplicație.</li>
          </ul>
          <p>
            Nu vindem datele tale. Accesul la date este limitat la scopuri de funcționare, securitate și mentenanță.
            Poți solicita ștergerea contului și a datelor asociate conform regulilor proiectului.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPrivacy(false)}>
            Închide
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default Login;
