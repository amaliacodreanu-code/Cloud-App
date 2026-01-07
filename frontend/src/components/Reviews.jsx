import { Container, Card, Badge, Button } from "react-bootstrap";
import React, { useState, useEffect } from "react";
import "../styles/Reviews.css";
import "./CustomRaiting.jsx";
import CustomRating from "./CustomRaiting.jsx";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const apiUrl = window.__ENV__["VITE_API_URL"];

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch(`${apiUrl}/reviews`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const data = await response.json();
        setReviews(data);
      } catch (error) {
        console.error("Error fetching reviews:", error);
      }
    };

    fetchReviews();
  }, []);

  const handleDelete = async (reviewId) => {
    try {
      const response = await fetch(
        `${apiUrl}/reviews/${reviewId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        console.log("Review deleted successfully");
        setReviews(reviews.filter((review) => review._id !== reviewId));
      } else {
        console.error("Error deleting review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
    }
  };

  return (
    <>
      <Container style={{ padding: 0, marginBottom: "2rem" }}>
        <h1>Reviews</h1>
        <p>Here are your latest reviews</p>
        <div className="review-list">
          {reviews.map((review, index) => (
            <Card key={index} className="review-container">
              <div key={review.id} className="review-item">
                <h3>{review.review}</h3>
                <p>{review.content}</p>
                <CustomRating rating={review.rating} />
                <div className="taste-profiles">
                  {review.tastes.map((taste) => (
                    <Badge
                      key={taste}
                      className="taste"
                      pill
                      bg="info"
                      style={{ marginRight: "0.5rem" }}
                    >
                      {taste}
                    </Badge>
                  ))}
                </div>
                <hr style={{ margin: "1rem 0" }} />
                <Button
                  variant="danger"
                  onClick={() => handleDelete(review._id)}
                  size="sm"
                >
                  Delete
                </Button>
              </div>
              <div className="product-info">
                <h3>{review.beer.name}</h3>
                <p>
                  <strong>Style: </strong>
                  {review.beer.style_name}
                </p>
                <p>
                  <strong>Category: </strong>
                  {review.beer.cat_name}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </>
  );
};

export default Reviews;
