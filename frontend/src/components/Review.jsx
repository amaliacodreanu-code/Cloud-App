import { useEffect, useState } from "react";
import { Button, Form, Modal } from "react-bootstrap";
import Rating from "./Rating";
import "../styles/ReviewModal.css";

const tasteProfiles = ["Sweet", "Sour", "Bitter", "Malt", "Smoke", "Tart & Funky"];

export default function Review({ drinkId, beerId, onSuccess }) {
  const id = drinkId ?? beerId;

  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  const [rating, setRating] = useState(0);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [reviewText, setReviewText] = useState("");
  const [existingReview, setExistingReview] = useState(null);

  const token = localStorage.getItem("token");

  const apiUrl =
    window.__ENV__?.VITE_API_URL ??
    import.meta.env.VITE_API_URL ??
    `${window.location.protocol}//${window.location.hostname}:8080/api`;

  const handleClose = () => setShow(false);

  const safeJson = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Expected JSON, got: ${text.slice(0, 120)}...`);
    }
  };

  const resetForm = () => {
    setExistingReview(null);
    setRating(0);
    setSelectedProfiles([]);
    setReviewText("");
  };

  useEffect(() => {
    setShow(false);
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const openAndLoad = async () => {
    if (!token) {
      alert("Trebuie să fii logat ca să adaugi o recenzie.");
      return;
    }
    if (!id) return;

    setShow(true);
    setBusy(true);

    try {
      // luăm recenziile userului curent (endpoint protejat)
      const res = await fetch(`${apiUrl}/reviews`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const myReviews = await safeJson(res);

      const arr = Array.isArray(myReviews) ? myReviews : [];

      const mine =
        arr.find((r) => String(r?.drink?.id) === String(id)) ||
        arr.find((r) => String(r?.drink_id) === String(id)) ||
        arr.find((r) => String(r?.beer_id) === String(id)) ||
        null;

      setExistingReview(mine);

      if (mine) {
        setRating(Number(mine.rating) || 0);
        setSelectedProfiles(Array.isArray(mine.tastes) ? mine.tastes : []);
        setReviewText(mine.review || "");
      } else {
        resetForm();
      }
    } catch (e) {
      console.error(e);
      resetForm();
    } finally {
      setBusy(false);
    }
  };

  const toggleTaste = (profile) => {
    setSelectedProfiles((prev) =>
      prev.includes(profile) ? prev.filter((p) => p !== profile) : [...prev, profile]
    );
  };

  const handleSave = async () => {
    if (!token || !id) return;

    if (!rating || rating < 1) {
      alert("Alege un rating.");
      return;
    }
    if (!selectedProfiles.length) {
      alert("Selectează cel puțin un taste profile.");
      return;
    }

    setBusy(true);
    try {
      // “edit” fără PUT: ștergem vechiul review înainte
      if (existingReview?._id) {
        const del = await fetch(`${apiUrl}/reviews/${existingReview._id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!del.ok) {
          const t = await del.text().catch(() => "");
          alert(`Nu pot șterge review-ul vechi. (${del.status}) ${t.slice(0, 140)}`);
          return;
        }
      }

      const payload = {
        drink_id: id,
        rating,
        review: reviewText,
        tastes: selectedProfiles,
      };

      const res = await fetch(`${apiUrl}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        alert(`Nu pot salva recenzia. (${res.status}) ${t.slice(0, 140)}`);
        return;
      }

      handleClose();
      resetForm();
      onSuccess?.();
    } finally {
      setBusy(false);
    }
  };

  const deleteExisting = async () => {
    if (!token || !existingReview?._id) return;

    if (!confirm("Sigur vrei să ștergi recenzia?")) return;

    setBusy(true);
    try {
      const res = await fetch(`${apiUrl}/reviews/${existingReview._id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        alert(`Nu pot șterge recenzia. (${res.status}) ${t.slice(0, 140)}`);
        return;
      }

      handleClose();
      resetForm();
      onSuccess?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button onClick={openAndLoad} variant="secondary" disabled={busy}>
        {existingReview ? "Edit Review" : "Add Review"}
      </Button>

      <Modal show={show} onHide={handleClose} centered className="review-modal">
        <Modal.Header closeButton>
          <Modal.Title>{existingReview ? "Edit your review" : "Add a review"}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label>Rating</Form.Label>
            <Rating rating={rating} setRating={setRating} />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Taste profile</Form.Label>
            <div className="review-tastes">
              {tasteProfiles.map((p) => (
                <span
                  key={p}
                  className={`review-taste ${selectedProfiles.includes(p) ? "active" : ""}`}
                  onClick={() => toggleTaste(p)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") toggleTaste(p);
                  }}
                >
                  {p}
                </span>
              ))}
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Message</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer className="review-footer">
          <div>
            {existingReview ? (
              <button className="review-btn-delete" onClick={deleteExisting} disabled={busy} type="button">
                Delete
              </button>
            ) : null}
          </div>

          <div className="review-footer-actions">
            <button className="review-btn-close" onClick={handleClose} disabled={busy} type="button">
              Close
            </button>
            <button className="review-btn-save" onClick={handleSave} disabled={busy} type="button">
              Save
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
}
