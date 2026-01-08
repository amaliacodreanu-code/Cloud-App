import { useEffect, useMemo, useState } from "react";
import { Badge, Button, Form, Modal, Container, Alert, Spinner } from "react-bootstrap";
import CustomRating from "./CustomRaiting";

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
      throw new Error(`Expected JSON, got: ${text.slice(0, 80)}...`);
    }
  };

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

      const existing = arr.find((r) => String(r?.producer_id ?? r?.producer?.id) === String(producerId));

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
    setErrorMsg("");
    setShow(true);
    await loadExisting();
  };

  const handleClose = () => {
    setShow(false);
    setErrorMsg("");
  };

  const handleBadgeClick = (profile) => {
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

      if (!res.ok) throw new Error(`HTTP ${res.status} while deleting producer review`);

      setExistingReviewId(null);
      setRating(0);
      setMessage("");
      setSelectedProfiles([]);

      if (typeof onSuccess === "function") onSuccess();
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

    try {
      if (existingReviewId) {
        const del = await fetch(`${apiUrl}/producer-reviews/${existingReviewId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!del.ok) throw new Error(`HTTP ${del.status} while deleting old producer review`);
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
      if (typeof onSuccess === "function") onSuccess();
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

      <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>{existingReviewId ? "Edit your producer review" : "Write a producer review"}</Modal.Title>
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
              <div>
                <CustomRating rating={rating} onChange={setRating} />
              </div>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Taste profile</Form.Label>
              <div>
                {tasteProfiles
                  .reduce((acc, profile, idx) => {
                    if (idx % 3 === 0) acc.push([]);
                    acc[acc.length - 1].push(profile);
                    return acc;
                  }, [])
                  .map((row, rowIndex) => (
                    <Container key={rowIndex} className="d-flex justify-content-start" style={{ gap: "10px" }}>
                      {row.map((profile) => (
                        <Badge
                          key={profile}
                          pill
                          bg="info"
                          onClick={() => handleBadgeClick(profile)}
                          style={{
                            cursor: "pointer",
                            fontSize: "1rem",
                            padding: "10px 15px",
                            marginTop: "15px",
                            userSelect: "none",
                            opacity: selectedProfiles.includes(profile) ? 1 : 0.6,
                          }}
                        >
                          {profile}
                        </Badge>
                      ))}
                    </Container>
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

        <Modal.Footer style={{ display: "flex", justifyContent: "space-between" }}>
          <div>
            {existingReviewId ? (
              <Button variant="danger" onClick={deleteExisting}>
                Delete
              </Button>
            ) : null}
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Save
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
}
