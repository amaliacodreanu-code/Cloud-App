import { Container, Card, Badge, Button, Alert } from "react-bootstrap";
import React, { useState, useEffect } from "react";
import "../styles/Reviews.css";
import CustomRating from "./CustomRaiting.jsx";

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState("");

  const apiUrl =
    window.__ENV__?.VITE_API_URL ??
    import.meta.env.VITE_API_URL ??
    `${window.location.protocol}//${window.location.hostname}:8080/api`;

  const token = localStorage.getItem("token");

  const safeJson = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Expected JSON, got: ${text.slice(0, 80)}...`);
    }
  };

  const fetchReviews = async () => {
    setError("");

    if (!token) {
      setReviews([]);
      setError("Trebuie să fii logat ca să vezi recenziile.");
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/reviews`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} at /reviews`);
      }

      const data = await safeJson(response);
      setReviews(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching reviews:", e);
      setError(e?.message || "Error fetching reviews");
      setReviews([]);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiUrl]);

  const handleDelete = async (reviewId) => {
    setError("");

    try {
      const response = await fetch(`${apiUrl}/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setReviews((prev) => prev.filter((review) => review._id !== reviewId));
      } else {
        setError("Error deleting review");
      }
    } catch (error) {
      console.error("Error deleting review:", error);
      setError("Error deleting review");
    }
  };

  return (
    <Container style={{ padding: 0, marginBottom: "2rem" }}>
      <h1>Reviews</h1>
      <p>Here are your latest reviews</p>

      {error ? <Alert variant="danger">{error}</Alert> : null}

      <div className="review-list">
        {reviews.map((review) => (
          <Card key={review._id} className="review-container">
            <div className="review-item">
              <h3>{review.review}</h3>

              {review.content ? <p>{review.content}</p> : null}

              <CustomRating rating={review.rating} />

              <div className="taste-profiles">
                {(review.tastes || []).map((taste) => (
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

              <Button variant="danger" onClick={() => handleDelete(review._id)} size="sm">
                Delete
              </Button>
            </div>

            <div className="product-info">
              <h3>{review?.drink?.name || "Unknown drink"}</h3>

              <p>
                <strong>Category: </strong>
                {review?.drink?.category || "-"}
              </p>

              <p>
                <strong>Producer: </strong>
                {review?.producer?.name || "-"}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </Container>
  );
};

export default Reviews;
