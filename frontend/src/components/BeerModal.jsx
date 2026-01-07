import { useEffect, useState } from "react";
import { Badge, Button, Modal } from "react-bootstrap";
import Review from "./Review";

const BeerModal = ({ show, handleClose, beer }) => {
  const [reviews, setReviews] = useState([]);
  const apiUrl = window.__ENV__["VITE_API_URL"];

  useEffect(() => {
    if (show && beer && beer.id) {
      fetch(`${apiUrl}/reviews/beer/${beer.id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          setReviews(data);
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  }, [show, beer]);

  if (!beer) {
    return null;
  }

  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton>
        <Modal.Title>{beer.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h4>Details</h4>
        <p>
          <strong>Category:</strong> {beer.cat_name}
        </p>
        <p>
          <strong>Style:</strong> {beer.style_name}
        </p>
        <p>
          <strong>ABV:</strong>{" "}
          {beer.abv ? parseFloat(beer.abv).toFixed(1) : "N/A"}%
        </p>

        {reviews.length > 0 && <h4>Reviews</h4>}
        {reviews.map((review, index) => (
          <div key={index} className="review">
            <div className="d-flex justify-content-between align-items-center">
              <h3>{review.user}</h3>
              <Badge bg="success">{review.rating}/5</Badge>
            </div>
            <p>{review.review}</p>
            {review.tastes.map((taste) => (
              <Badge key={taste} bg="dark" className="me-1">
                {taste}
              </Badge>
            ))}
          </div>
        ))}
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Review beerId={beer.id} />
        <Button variant="danger" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default BeerModal;
