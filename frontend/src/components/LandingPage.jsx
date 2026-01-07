import { Button, Container } from "react-bootstrap";
import { ListGroup } from "react-bootstrap";
import logo from "../images/logo.png";
import "../styles/LandingPage.css";

export default function LandingPage() {
  const names = ["Codreanu Amalia", "Enachescu Dragos", "Calcan Cristian"];

  return (
    <div className="dr-landing">
      <Container className="dr-shell">
        <header className="dr-hero dr-fade-up">
          <img className="dr-logo dr-logo-fade" src={logo} alt="DrinksReview logo" />

          <h1 className="dr-title">DrinksReview</h1>

          <p className="dr-subtitle">
            Platforma DrinksReview îi ajută pe pasionații de băuturi să descopere sortimente noi și să își
            organizeze preferințele. Utilizatorii pot citi și publica recenzii, pot compara băuturi după arome
            și caracteristici și pot salva recomandări pentru următoarea încercare.
          </p>

          <div className="dr-actions">
            <Button className="dr-btn dr-btn-secondary" href="/login">
              Login
            </Button>
            <Button className="dr-btn dr-btn-primary" href="/register">
              Register
            </Button>
          </div>
        </header>

        <aside className="dr-credits dr-credits-anim">
          <div className="dr-credits-title">Proiect realizat de :</div>
          <ListGroup className="dr-credits-list">
            {names.map((name, idx) => (
              <ListGroup.Item className="dr-credits-item" key={idx}>
                {name}
              </ListGroup.Item>
            ))}
          </ListGroup>
        </aside>
      </Container>
    </div>
  );
}
