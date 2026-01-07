import { Button, Container } from "react-bootstrap";
import logo from "../images/logo.png";
import { ListGroup } from "react-bootstrap";

export default function LandingPage() {
    const names = ["Robert Vulpe", "Mircea Popa", "Ionuț Bîrjovanu", "Dragoș Enăchescu"];

    return (
        <Container style={{ textAlign: "center", backgroundColor: "white", height: "100vh" }}>
            <div
                className="d-flex justify-content-center align-items-center flex-column"
                style={{ padding: "2rem" }}
            >
                <img src={logo} alt="logo" style={{ width: "128px" }} />

                <h1>Beer Review</h1>
                <p>Discover and review beers</p>
                <p>
                    A project by:
                </p>

                <ListGroup>
                    {names.map((name, index) => (
                        <ListGroup.Item key={index}>{name}</ListGroup.Item>
                    ))}
                </ListGroup>
            </div>

            <hr style={{ margin: "1rem 0" }} />
            <p>Get started by logging in or registering</p>

            <Button variant="secondary" href="/login" style={{ marginRight: "1rem" }}>
                Login
            </Button>
            <Button variant="primary" href="/register">
                Register
            </Button>
        </Container>
    );
}
