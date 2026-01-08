import { useEffect, useState } from "react";
import "../styles/Profile.css";

// categorii mai generale pentru drinksreviews
const preferences = ["Cocktail", "Spirit", "Wine", "Beer", "Liqueur", "Non-alcoholic", "Altul"];

export default function Profile() {
  const [profile, setProfile] = useState(null);

  const [drinkReviews, setDrinkReviews] = useState([]);
  const [producerReviews, setProducerReviews] = useState([]);

  const [bio, setBio] = useState("");
  const [preferredStyle, setPreferredStyle] = useState("");

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
      // dacă primești HTML de la gateway, nu încercăm să-l parsăm forțat
      throw new Error(`Expected JSON, got: ${text.slice(0, 80)}...`);
    }
  };

  const loadAll = async () => {
    const [pRes, drRes, prRes] = await Promise.all([
      fetch(`${apiUrl}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${apiUrl}/reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${apiUrl}/producer-reviews`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    if (!pRes.ok) throw new Error(`Profile failed: ${pRes.status}`);
    if (!drRes.ok) throw new Error(`Drink reviews failed: ${drRes.status}`);
    // dacă nu ai implementat încă producer-reviews, îl lăsăm gol fără să stricăm pagina
    // dar dacă există și e 401/404, nu vrem să crape tot
    let prData = [];
    if (prRes.ok) {
      prData = await safeJson(prRes);
    }

    const pData = await safeJson(pRes);
    const drData = await safeJson(drRes);

    setProfile(pData);
    setBio(pData?.bio || "");
    setPreferredStyle(pData?.preferred_style || "");

    setDrinkReviews(Array.isArray(drData) ? drData : []);
    setProducerReviews(Array.isArray(prData) ? prData : []);
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }

    loadAll().catch((e) => {
      console.error(e);
      // dacă ceva e prost pe backend, măcar nu moare complet UI-ul
      setProfile(null);
      setDrinkReviews([]);
      setProducerReviews([]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async () => {
    await fetch(`${apiUrl}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        bio,
        preferred_style: preferredStyle || "Altul",
      }),
    });

    await loadAll();
  };

  if (!profile) return null;

  const rankIcon = profile.rank === "Expert" ? "⭐" : "🔰";

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-identity">
            <div className="profile-username">
              Cont: <span>{profile.username}</span>
            </div>

            <span className={`dr-badge dr-badge-${profile.rank?.toLowerCase()}`}>
              <span className="dr-badge-icon">{rankIcon}</span>
              {profile.rank}
            </span>
          </div>

          <div className="profile-stats">
            <div>Recenzii băuturi: {drinkReviews.length}</div>
            <div>Recenzii producători: {producerReviews.length}</div>
            <div>
              Ultimul login:{" "}
              {profile.last_login
                ? new Date(profile.last_login).toLocaleString("ro-RO")
                : "Neînregistrat"}
            </div>
          </div>
        </div>

        <div className="profile-pref">
          Preferință: <strong>{profile.preferred_style || "Necompletat"}</strong>
        </div>

        <div className="profile-form">
          <label>Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} />

          <label>Preferință</label>
          <select value={preferredStyle} onChange={(e) => setPreferredStyle(e.target.value)}>
            <option value="">Alege...</option>
            {preferences.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <div className="profile-actions">
            <button onClick={save}>Salvează</button>
          </div>
        </div>

        {/* DRINK REVIEWS */}
        <div className="profile-reviews">
          <div className="profile-reviews-head">
            <div className="profile-reviews-title">Recenziile mele, băuturi</div>
            <div className="profile-reviews-count">{drinkReviews.length}</div>
          </div>

          <div className="profile-reviews-list">
            {drinkReviews.length ? (
              drinkReviews
                .slice()
                .reverse()
                .map((r) => {
                  const drinkName = r?.drink?.name || `Băutură #${r?.drink_id || "-"}`;
                  return (
                    <div className="profile-review-item" key={r._id}>
                      <div className="profile-review-top">
                        <div className="profile-review-item-title">{drinkName}</div>
                        <div className="profile-review-rating">{r.rating}/5</div>
                      </div>

                      {r.review ? <div className="profile-review-text">{r.review}</div> : null}

                      {Array.isArray(r.tastes) && r.tastes.length > 0 ? (
                        <div className="profile-review-tags">
                          {r.tastes.map((t) => (
                            <span className="profile-tag" key={t}>
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
            ) : (
              <div className="profile-review-empty">Nu ai încă recenzii la băuturi.</div>
            )}
          </div>
        </div>

        {/* PRODUCER REVIEWS */}
        <div className="profile-reviews" style={{ marginTop: 18 }}>
          <div className="profile-reviews-head">
            <div className="profile-reviews-title">Recenziile mele, producători</div>
            <div className="profile-reviews-count">{producerReviews.length}</div>
          </div>

          <div className="profile-reviews-list">
            {producerReviews.length ? (
              producerReviews
                .slice()
                .reverse()
                .map((r) => {
                  const producerName = r?.producer?.name || `Producător #${r?.producer_id || "-"}`;
                  return (
                    <div className="profile-review-item" key={r._id}>
                      <div className="profile-review-top">
                        <div className="profile-review-beer">{producerName}</div>
                        <div className="profile-review-rating">{r.rating}/5</div>
                      </div>

                      {r.review ? <div className="profile-review-text">{r.review}</div> : null}

                      {Array.isArray(r.tastes) && r.tastes.length > 0 ? (
                        <div className="profile-review-tags">
                          {r.tastes.map((t) => (
                            <span className="profile-tag" key={t}>
                              {t}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })
            ) : (
              <div className="profile-review-empty">Nu ai încă recenzii la producători.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
