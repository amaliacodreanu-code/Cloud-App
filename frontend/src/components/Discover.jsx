import { useEffect, useMemo, useState } from "react";
import CustomNavbar from "./Navbar";
import Review from "./Review";
import ProducerReview from "./ProducerReview";
import "../styles/DiscoverProfile.css";

export default function Discover() {
  const [activeTab, setActiveTab] = useState("drinks"); // "drinks" | "producers"
  const [drinks, setDrinks] = useState([]);
  const [producers, setProducers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedDrink, setSelectedDrink] = useState(null);
  const [selectedProducer, setSelectedProducer] = useState(null);

  const [error, setError] = useState("");

  const token = localStorage.getItem("token");

  const apiUrl =
    window.__ENV__?.VITE_API_URL ??
    import.meta.env.VITE_API_URL ??
    `${window.location.protocol}//${window.location.hostname}:8080/api`;

  const safeJson = async (res) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      throw new Error(`Expected JSON, got: ${text.slice(0, 80)}...`);
    }
  };

  const fetchJson = async (url) => {
    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return safeJson(res);
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError("");

    Promise.all([fetchJson(`${apiUrl}/drinks`), fetchJson(`${apiUrl}/producers`)])
      .then(([d, p]) => {
        if (!mounted) return;

        const dd = Array.isArray(d) ? d : [];
        const pp = Array.isArray(p) ? p : [];

        setDrinks(dd);
        setProducers(pp);

        setSelectedDrink(dd[0] ?? null);
        setSelectedProducer(pp[0] ?? null);

        setLoading(false);
      })
      .catch((e) => {
        console.error(e);
        if (!mounted) return;
        setError(e?.message || "Request failed");
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [apiUrl]);

  // reset selection correctly when switching tabs
  useEffect(() => {
    if (activeTab === "drinks") {
      if (!selectedDrink && drinks.length) setSelectedDrink(drinks[0]);
    } else {
      if (!selectedProducer && producers.length) setSelectedProducer(producers[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, drinks, producers]);

  const listItems = useMemo(
    () => (activeTab === "drinks" ? drinks : producers),
    [activeTab, drinks, producers]
  );

  const selected = activeTab === "drinks" ? selectedDrink : selectedProducer;

  const pick = (item) => {
    if (activeTab === "drinks") setSelectedDrink(item);
    else setSelectedProducer(item);
  };

  const isActive = (item) => {
    if (activeTab === "drinks") return String(item?.id) === String(selectedDrink?.id);
    return String(item?.id) === String(selectedProducer?.id);
  };

  const drinkId = selectedDrink?.id ?? null;

  // producer id for the selected drink (NOT selectedProducer)
  const drinkProducerId =
    selectedDrink?.producerId ??
    selectedDrink?.producer_id ??
    selectedDrink?.producer?.id ??
    null;

  const addFavorite = async () => {
    if (!token) {
      alert("Trebuie să fii logat ca să adaugi la favorite.");
      return;
    }
    if (!drinkId) return;

    const res = await fetch(`${apiUrl}/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ drink_id: drinkId }),
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      alert(`Nu pot adăuga la favorite. (${res.status}) ${t.slice(0, 120)}`);
      return;
    }

    alert("Adăugat la favorite.");
  };

  return (
    <>
      <CustomNavbar />

      <div className="dp-page">
        <div className="dp-card">
          <div className="dp-header">
            <div className="dp-titleblock">
              <div className="dp-title">Discover</div>
              <div className="dp-subtitle">
                {activeTab === "drinks"
                  ? `${drinks.length} drinks`
                  : `${producers.length} producers`}
              </div>
            </div>

            <div className="dp-tabs">
              <button
                className={`dp-tab ${activeTab === "drinks" ? "active" : ""}`}
                onClick={() => setActiveTab("drinks")}
                type="button"
              >
                Drinks
              </button>
              <button
                className={`dp-tab ${activeTab === "producers" ? "active" : ""}`}
                onClick={() => setActiveTab("producers")}
                type="button"
              >
                Producers
              </button>
            </div>
          </div>

          {loading ? (
            <div className="dp-loading">Loading…</div>
          ) : error ? (
            <div className="dp-error">
              <div className="dp-error-title">Nu pot încărca datele.</div>
              <div className="dp-error-body">{error}</div>
              <div className="dp-error-body">API: {apiUrl}</div>
            </div>
          ) : (
            <div className="dp-body">
              <div className="dp-list">
                <div className="dp-list-head">
                  <div className="dp-list-title">
                    {activeTab === "drinks" ? "Drinks" : "Producers"}
                  </div>
                  <div className="dp-list-count">{listItems.length}</div>
                </div>

                <div className="dp-list-scroll">
                  {listItems.map((item, idx) => (
                    <button
                      key={`${activeTab}-${item?.id ?? "x"}-${idx}`}
                      className={`dp-list-item ${isActive(item) ? "active" : ""}`}
                      onClick={() => pick(item)}
                      type="button"
                    >
                      <div className="dp-item-name">{item?.name || "Unnamed"}</div>

                      {activeTab === "drinks" ? (
                        <div className="dp-item-meta">
                          <span>{item?.category || "—"}</span>
                          <span className="dp-dot">•</span>
                          <span>
                            {item?.abv != null && item?.abv !== ""
                              ? `${Number(item.abv).toFixed(1)}%`
                              : "ABV: N/A"}
                          </span>
                        </div>
                      ) : (
                        <div className="dp-item-meta">
                          <span>{item?.type || "—"}</span>
                          {item?.country ? (
                            <>
                              <span className="dp-dot">•</span>
                              <span>{item.country}</span>
                            </>
                          ) : null}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div className="dp-detail">
                {!selected ? (
                  <div className="dp-empty">Selectează un element din listă.</div>
                ) : activeTab === "drinks" ? (
                  <>
                    <div className="dp-detail-head">
                      <div className="dp-detail-title">{selectedDrink?.name}</div>

                      <div className="dp-detail-actions">
                        <button className="dp-btn" onClick={addFavorite} type="button">
                          Add to favorites
                        </button>

                        {/* Review for drink */}
                        <Review drinkId={drinkId} onSuccess={() => {}} />

                        {/* Optional: review for producer of this drink */}
                        {drinkProducerId ? (
                          <ProducerReview producerId={drinkProducerId} onSuccess={() => {}} />
                        ) : null}
                      </div>
                    </div>

                    <div className="dp-section">
                      <div className="dp-section-title">Details</div>
                      <div className="dp-kv">
                        <div className="dp-k">Category</div>
                        <div className="dp-v">{selectedDrink?.category || "—"}</div>

                        <div className="dp-k">ABV</div>
                        <div className="dp-v">
                          {selectedDrink?.abv != null && selectedDrink?.abv !== ""
                            ? `${Number(selectedDrink.abv).toFixed(1)}%`
                            : "—"}
                        </div>

                        <div className="dp-k">Producer</div>
                        <div className="dp-v">{selectedDrink?.producer?.name || "—"}</div>
                      </div>
                    </div>

                    {selectedDrink?.description ? (
                      <div className="dp-section">
                        <div className="dp-section-title">Description</div>
                        <div className="dp-text">{selectedDrink.description}</div>
                      </div>
                    ) : null}
                  </>
                ) : (
                  <>
                    <div className="dp-detail-head">
                      <div className="dp-detail-title">{selectedProducer?.name}</div>

                      <div className="dp-detail-actions">
                        {/* Review for producer */}
                        <ProducerReview producerId={selectedProducer?.id ?? null} onSuccess={() => {}} />
                      </div>
                    </div>

                    <div className="dp-section">
                      <div className="dp-section-title">Details</div>
                      <div className="dp-kv">
                        <div className="dp-k">Type</div>
                        <div className="dp-v">{selectedProducer?.type || "—"}</div>

                        <div className="dp-k">City</div>
                        <div className="dp-v">{selectedProducer?.city || "—"}</div>

                        <div className="dp-k">Country</div>
                        <div className="dp-v">{selectedProducer?.country || "—"}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
