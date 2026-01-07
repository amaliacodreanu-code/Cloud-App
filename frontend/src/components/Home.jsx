import React from "react";
import CustomNavbar from "./Navbar";
import {Accordion, Container} from "react-bootstrap";

const Home = () => {
    return (
        <>
            <CustomNavbar/>
            <Container className="mt-5">
                <h1>Home</h1>
                <p>
                    <strong>Beer Review</strong> is a platform where you can review your{" "}
                    <strong>favorite beers</strong> and share your thoughts with other
                    beer enthusiasts.
                </p>
                <h3>Features</h3>
                <Accordion defaultActiveKey="0">
                    <Accordion.Item eventKey="0">
                        <Accordion.Header>Review and grade beers</Accordion.Header>
                        <Accordion.Body>
                            <p>
                                You can <a href="/search">search</a> here for your favorite beers and
                                leave a review with a grade from 1 to 5.
                            </p>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="1">
                        <Accordion.Header>Add to favorites</Accordion.Header>
                        <Accordion.Body>
                            <p>
                                You can add beers to your <a href="/search">favorites</a> list
                                and keep track of the beers you have reviewed in your <a href="/profile">profile</a>.
                            </p>
                        </Accordion.Body>
                    </Accordion.Item>
                    <Accordion.Item eventKey="2">
                        <Accordion.Header>Get personal recommendations</Accordion.Header>
                        <Accordion.Body>
                            <p>
                                Based on your reviews and favorite beers, we will give you personal <a
                                href="/profile">recommendations</a> for new beers to try.
                            </p>
                        </Accordion.Body>
                    </Accordion.Item>
                </Accordion>
            </Container>
        </>
    );
};

export default Home;
