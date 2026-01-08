import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Form, Modal, Spinner } from "react-bootstrap";
import Rating from "./Rating";
import "../styles/ReviewModal.css";

export default function ProducerReview({ producerId, onSuccess }) {
  const [show, setShow] = useState(false);

  const [rating, setRating] = useState(0);
  const [selectedProfiles, setSelectedProfiles] = useState([]);
  const [message, setMessage] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
  const [loadingExisting, setLoadingExisting] = useState(false);

  const [existingReviewId, setExistingReviewId] = useState(null);

  const apiUrl =
    window.__ENV__?.VITE_API_URL ??
    import.meta.env.VITE_API_URL ??
    `${window.location.protocol}//${window.location.hostname}:8080/api`;

  const token = localStorage.getItem("token");

  const tasteProfiles = useMemo(
    () => ["Sweet", "Sour", "Bitter", "Malt", "Smoke", "Tart & Funky"],
    []
  );

  const safeJson = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Expected JSON, got: ${text.slice(0, 120)}...`);
    }
  };

  const resetForm = () => {
    setExistingReviewId(null);
    setRating(0);
    setSelectedProfiles([]);
    setMessage("");
  };

  useEffect(() => {
    // dacă se schimbă producer-ul selectat, închidem și resetăm
    setShow(false);
    setErrorMsg("");
    resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [producerId]);

  const loadExisting = async () => {
    if (!token || !producerId) return;

    setLoadingExisting(true);
    setExistingReviewId(null);

    try {
      const res = await fetch(`${apiUrl}/producer-reviews`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(`HTTP ${res.status} while loading producer reviews`);

      const data = await safeJson(res);
      const arr = Array.isArray(data) ? data : [];

      const existing = arr.find(
        (r) => String(r?.producer_id ?? r?.producer?.id) === String(producerId)
      );

      if (existing) {
        setExistingReviewId(existing._id);
        setRating(Number(existing.rating) || 0);
        setMessage(existing.review || "");
        setSelectedProfiles(Array.isArray(existing.tastes) ? existing.tastes : []);
      } else {
        setRating(0);
        setMessage("");
        setSelectedProfiles([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingExisting(false);
    }
  };

  const handleShow = async () => {
    if (!token) {
      setErrorMsg("Trebuie să fii logat ca să adaugi/modifici o recenzie.");
      setShow(true);
      return;
    }

    setErrorMsg("");
    setShow(true);
    await loadExisting();
  };

  const handleClose = () => {
    setShow(false);
    setErrorMsg("");
  };

  const handleTasteClick = (profile) => {
    setSelectedProfiles((prev) =>
      prev.includes(profile) ? prev.filter((p) => p !== profile) : [...prev, profile]
    );
  };

  const deleteExisting = async () => {
    if (!token || !existingReviewId) return;

    setErrorMsg("");
    try {
      const res = await fetch(`${apiUrl}/producer-reviews/${existingReviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}. ${t.slice(0, 120)}`);
      }

      resetForm();
      handleClose();
      onSuccess?.();
    } catch (e) {
      console.error(e);
      setErrorMsg("Nu pot șterge review-ul.");
    }
  };

  const handleSave = async () => {
    setErrorMsg("");

    if (!token) {
      setErrorMsg("Trebuie să fii logat ca să adaugi/modifici o recenzie.");
      return;
    }
    if (!producerId) {
      setErrorMsg("Lipsește producerId.");
      return;
    }
    if (rating <= 0) {
      setErrorMsg("Alege un rating.");
      return;
    }
    if (!selectedProfiles.length) {
      setErrorMsg("Selectează cel puțin un taste profile.");
      return;
    }

    try {
      // “edit” fără PUT: ștergem vechiul review înainte
      if (existingReviewId) {
        const del = await fetch(`${apiUrl}/producer-reviews/${existingReviewId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!del.ok) {
          const t = await del.text().catch(() => "");
          throw new Error(`HTTP ${del.status}. ${t.slice(0, 120)}`);
        }
      }

      const payload = {
        producer_id: producerId,
        rating,
        tastes: selectedProfiles,
        review: message,
      };

      const res = await fetch(`${apiUrl}/producer-reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status}. ${text.slice(0, 120)}`);
      }

      handleClose();
      onSuccess?.();
    } catch (e) {
      console.error(e);
      setErrorMsg("Nu pot salva review-ul.");
    }
  };

  const mainLabel = existingReviewId ? "Edit Producer Review" : "Add Producer Review";

  return (
    <>
      <Button variant="info" onClick={handleShow} disabled={!producerId}>
        {mainLabel}
      </Button>

      <Modal show={show} onHide={handleClose} centered className="review-modal">
        <Modal.Header closeButton>
          <Modal.Title>
            {existingReviewId ? "Edit your producer review" : "Write a producer review"}
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          {errorMsg ? <Alert variant="danger">{errorMsg}</Alert> : null}

          {loadingExisting ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Spinner animation="border" size="sm" />
              <div>Loading…</div>
            </div>
          ) : null}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Rating</Form.Label>
              <Rating rating={rating} setRating={setRating} />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Taste profile</Form.Label>
              <div className="review-tastes">
                {tasteProfiles.map((profile) => (
                  <span
                    key={profile}
                    className={`review-taste ${selectedProfiles.includes(profile) ? "active" : ""}`}
                    onClick={() => handleTasteClick(profile)}
                  >
                    {profile}
                  </span>
                ))}
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
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

        <Modal.Footer className="review-footer">
          <div>
            {existingReviewId ? (
              <button className="review-btn-delete" onClick={deleteExisting} type="button">
                Delete
              </button>
            ) : null}
          </div>

          <div className="review-footer-actions">
            <button className="review-btn-close" onClick={handleClose} type="button">
              Close
            </button>
            <button className="review-btn-save" onClick={handleSave} type="button">
              Save
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
}
