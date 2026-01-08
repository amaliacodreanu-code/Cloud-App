import React from "react";
import CustomNavbar from "./Navbar";
import { Accordion, Container } from "react-bootstrap";
import "../styles/Home.css";

const Home = () => {
  return (
    <>
      <CustomNavbar />

      <div className="home-page">
        <Container className="home-card">
          <div className="home-head">
            <h1 className="home-title">Home</h1>
            <p className="home-subtitle">
              <strong>DrinksReview</strong> is a platform where you can review your{" "}
              <strong>favorite drinks</strong> and share your thoughts with other
              people who also enjoy making adult decisions.
            </p>
          </div>

          <div className="home-section">
            <div className="home-section-title">Features</div>

            <Accordion defaultActiveKey="0" className="home-accordion">
              <Accordion.Item eventKey="0" className="home-acc-item">
                <Accordion.Header>Review and rate drinks</Accordion.Header>
                <Accordion.Body>
                  <p>
                    Use <a href="/search">Search</a> to find drinks and leave a review
                    with a rating from 1 to 5.
                  </p>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="1" className="home-acc-item">
                <Accordion.Header>Add to favorites</Accordion.Header>
                <Accordion.Body>
                  <p>
                    Save drinks to your <a href="/favorites">favorites</a> and keep
                    track of what you reviewed in your{" "}
                    <a href="/profile">profile</a>.
                  </p>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="2" className="home-acc-item">
                <Accordion.Header>Get recommendations</Accordion.Header>
                <Accordion.Body>
                  <p>
                    Based on your favorites and reviews, you will get{" "}
                    <a href="/recommendations">recommendations</a> for new drinks to try.
                  </p>
                </Accordion.Body>
              </Accordion.Item>

              <Accordion.Item eventKey="3" className="home-acc-item">
                <Accordion.Header>Review producers too</Accordion.Header>
                <Accordion.Body>
                  <p>
                    You can also review producers in <a href="/discover">Discover</a>,
                    so you can keep track of who consistently makes good stuff.
                  </p>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </div>
        </Container>
      </div>
    </>
  );
};

export default Home;
