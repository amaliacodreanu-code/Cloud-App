import React, { useEffect, useState } from "react";
import CustomNavbar from "./Navbar";
import { Button, Card, Container, Spinner } from "react-bootstrap";
import DrinkModal from "./DrinkModal";
import "../styles/Recommended.css";

export default function Recommended() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const perPage = 6;

  const [minReviews, setMinReviews] = useState(2);
  const [sort, setSort] = useState("avg"); // "avg" | "count"

  const [show, setShow] = useState(false);
  const [selectedDrink, setSelectedDrink] = useState(null);

  const apiUrl =
    window.__ENV__?.VITE_API_URL ??
    import.meta.env.VITE_API_URL ??
    `${window.location.protocol}//${window.location.hostname}:8080/api`;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${apiUrl}/top-rated?page=${page}&per_page=${perPage}&min_reviews=${minReviews}&sort=${sort}`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [apiUrl, page, perPage, minReviews, sort]);

  const handleClose = () => setShow(false);
  const openDetails = (drink) => {
    setSelectedDrink(drink);
    setShow(true);
  };

  return (
    <>
      <CustomNavbar />

      <div className="rec-page">
        <Container className="rec-card">
          <div className="rec-header">
            <div>
              <div className="rec-title">Top rated drinks</div>
              <div className="rec-subtitle">
                Ranking după media rating-urilor și numărul de recenzii.
              </div>
            </div>

            <div className="rec-controls">
              <div className="rec-control">
                <label>Sort</label>
                <select
                  value={sort}
                  onChange={(e) => {
                    setPage(1);
                    setSort(e.target.value);
                  }}
                >
                  <option value="avg">Average rating</option>
                  <option value="count">Most reviews</option>
                </select>
              </div>

              <div className="rec-control">
                <label>Min reviews</label>
                <select
                  value={minReviews}
                  onChange={(e) => {
                    setPage(1);
                    setMinReviews(Number(e.target.value));
                  }}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                  <option value={5}>5</option>
                </select>
              </div>

              <div className="rec-pager">
                <button
                  className="rec-btn rec-btn-ghost"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  type="button"
                >
                  Previous
                </button>
                <button
                  className="rec-btn rec-btn-primary"
                  onClick={() => setPage((p) => p + 1)}
                  type="button"
                >
                  Next
                </button>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="rec-loading">
              <Spinner animation="border" role="status" />
            </div>
          ) : (
            <div className="rec-grid">
              {rows.map((row, idx) => {
                const drink = row.drink || {};
                const producer = row.producer || drink.producer || null;

                return (
                  <Card className="rec-item" key={`${row.drink_id}-${idx}`}>
                    <Card.Body>
                      <div className="rec-rank">
                        #{(page - 1) * perPage + idx + 1}
                      </div>

                      <Card.Title className="rec-name">
                        {drink.name || `Drink #${row.drink_id}`}
                      </Card.Title>

                      <div className="rec-meta">
                        <span>
                          Avg: <strong>{row.avg_rating ?? "—"}</strong>/5
                        </span>
                        <span className="rec-dot">•</span>
                        <span>
                          Reviews: <strong>{row.review_count ?? 0}</strong>
                        </span>
                      </div>

                      <div className="rec-small">
                        {drink.category || "—"}
                        {drink.abv != null && drink.abv !== "" ? (
                          <>
                            <span className="rec-dot">•</span>
                            {Number(drink.abv).toFixed(1)}% alc
                          </>
                        ) : null}
                      </div>

                      <div className="rec-small">
                        Producer: <strong>{producer?.name || "—"}</strong>
                      </div>

                      <button
                        className="rec-btn rec-btn-primary rec-btn-full"
                        onClick={() => openDetails(drink)}
                        type="button"
                      >
                        Details
                      </button>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )}
        </Container>
      </div>

      {selectedDrink && (
        <DrinkModal show={show} handleClose={handleClose} drink={selectedDrink} />
      )}
    </>
  );
}
