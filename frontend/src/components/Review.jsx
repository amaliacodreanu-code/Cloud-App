import { useState } from "react";
import { Badge, Button, Form, Modal, Container } from "react-bootstrap";
import { Alert } from "react-bootstrap";
import CustomRating from "./CustomRaiting";

function Review({ beerId }) {
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState(0);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [message, setMessage] = useState("");
  const apiUrl = window.__ENV__["VITE_API_URL"];

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const handleRatingChange = (value) => {
    setRating(value);
  };

  const handleBadgeClick = (profile) => {
    setSelectedProfiles((prevSelectedProfiles) =>
      prevSelectedProfiles.includes(profile)
        ? prevSelectedProfiles.filter((p) => p !== profile)
        : [...prevSelectedProfiles, profile]
    );
  };

  const handleSave = async () => {
    const reviewData = {
      beer_id: beerId,
      rating: rating,
      tastes: selectedProfiles,
      review: message,
    };

    try {
      const response = await fetch(`${apiUrl}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(reviewData),
      });

      if (response.ok) {
        console.log("Review submitted successfully");
        window.location.reload();
      } else {
        // response.message contains the error message
        <Alert variant="danger">{response.message}</Alert>;

      }
    } catch (error) {
      console.error("Error:", error);
      <Alert variant="danger">Error submitting review</Alert>;
    }

    handleClose();
  };

  const tasteProfiles = [
    "Sweet",
    "Sour",
    "Bitter",
    "Malt",
    "Smoke",
    "Tart & Funky",
  ];

  return (
    <>
      <Button variant="info" onClick={handleShow}>
        Add Review
      </Button>

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Write your review</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3" controlId="ratingInput">
              <Form.Label>Rating</Form.Label>
              <div>
                <CustomRating rating={rating} onChange={handleRatingChange} />
              </div>
            </Form.Group>

            <Form.Group className="mb-3" controlId="tasteProfileInput">
              <Form.Label>Taste profile</Form.Label>
              <div>
                {tasteProfiles
                  .reduce((acc, profile, idx) => {
                    if (idx % 3 === 0) acc.push([]);
                    acc[acc.length - 1].push(profile);
                    return acc;
                  }, [])
                  .map((row, rowIndex) => (
                    <Container key={rowIndex} className="d-flex justify-content-start">
                      {row.map((profile, index) => (
                        <Badge
                          key={index}
                          pill
                          bg={
                            profile === "Sweet"
                              ? "primary"
                              : profile === "Sour"
                              ? "dark"
                              : profile === "Bitter"
                              ? "warning"
                              : profile === "Malt"
                              ? "danger"
                              : profile === "Smoke"
                              ? "info"
                              : "success"
                          }
                          className={`taste-badge ${
                            selectedProfiles.includes(profile) ? "selected" : ""
                          }`}
                          onClick={() => handleBadgeClick(profile)}
                          style={{
                            cursor: "pointer",
                            fontSize: "1rem",
                            padding: "10px 15px",
                            marginTop: "15px",
                          }}
                        >
                          {profile}
                        </Badge>
                      ))}
                    </Container>
                  ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3" controlId="messageInput">
              <Form.Label>Message</Form.Label>
              <Form.Control
                placeholder="Share your thoughts"
                as="textarea"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default Review;
