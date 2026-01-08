import { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import Review from "./Review";
import "../styles/DrinkModal.css";

const DrinkModal = ({ show, handleClose, drink }) => {
  const [reviews, setReviews] = useState([]);
  const apiUrl =
    window.__ENV__?.VITE_API_URL ??
    import.meta.env.VITE_API_URL ??
    `${window.location.protocol}//${window.location.hostname}:8080/api`;

  useEffect(() => {
    if (!show || !drink?.id) return;

    fetch(`${apiUrl}/reviews/drink/${drink.id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })
      .then((r) => r.json())
      .then((data) => setReviews(Array.isArray(data) ? data : []))
      .catch((e) => {
        console.error("Error:", e);
        setReviews([]);
      });
  }, [show, drink, apiUrl]);

  if (!drink) return null;

  return (
    <Modal show={show} onHide={handleClose} centered size="lg" className="dr-modal">
      <Modal.Header closeButton>
        <Modal.Title>{drink.name}</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <div className="dr-section-title">Details</div>

        <div className="dr-details">
          <div className="dr-kv">
            <div className="dr-k">Category</div>
            <div className="dr-v">{drink.category || drink.cat_name || "—"}</div>

            <div className="dr-k">Style</div>
            <div className="dr-v">{drink.style_name || "—"}</div>

            <div className="dr-k">ABV</div>
            <div className="dr-v">
              {drink.abv != null && drink.abv !== ""
                ? `${Number(drink.abv).toFixed(1)}%`
                : "—"}
            </div>

            <div className="dr-k">Producer</div>
            <div className="dr-v">{drink.producer?.name || "—"}</div>
          </div>
        </div>

        <div className="dr-section-title" style={{ marginTop: 16 }}>
          Reviews
        </div>

        {reviews.length ? (
          <div className="dr-reviews">
            {reviews.map((r, idx) => (
              <div key={r._id || idx} className="dr-review">
                <div className="dr-review-top">
                  <div className="dr-review-user">{r.user || "Anon"}</div>
                  <div className="dr-rating">
                    <span className="star">★</span> {r.rating}/5
                  </div>
                </div>

                {r.review ? <div className="dr-review-text">{r.review}</div> : null}

                {Array.isArray(r.tastes) && r.tastes.length ? (
                  <div className="dr-tags">
                    {r.tastes.map((t) => (
                      <span key={t} className="dr-tag">
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="dr-empty">Nu există recenzii încă.</div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <div className="dr-footer">
          <Review drinkId={drink.id} />
          <button type="button" className="dr-btn-close" onClick={handleClose}>
            Close
          </button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default DrinkModal;
