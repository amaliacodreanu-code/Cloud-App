import { useEffect, useState } from "react";
import "../styles/Profile.css";

const styles = ["IPA", "Lager", "Stout", "Porter", "Sour", "Wheat", "Altul"];

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [bio, setBio] = useState("");
  const [preferredStyle, setPreferredStyle] = useState("");
  const token = localStorage.getItem("token");
  const apiUrl = window.__ENV__["VITE_API_URL"];

  const loadAll = async () => {
    const [pRes, rRes] = await Promise.all([
      fetch(`${apiUrl}/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      }),
      fetch(`${apiUrl}/reviews`, {
        headers: { Authorization: `Bearer ${token}` }
      })
    ]);

    const pData = await pRes.json();
    const rData = await rRes.json();

    setProfile(pData);
    setBio(pData.bio || "");
    setPreferredStyle(pData.preferred_style || "");
    setReviews(Array.isArray(rData) ? rData : []);
  };

  useEffect(() => {
    if (!token) {
      window.location.href = "/login";
      return;
    }
    loadAll();
  }, []);

  const save = async () => {
    await fetch(`${apiUrl}/profile`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bio,
        preferred_style: preferredStyle || "Altul"
      })
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
            <div>Recenzii: {profile.review_count}</div>
            <div>
              Ultimul login:{" "}
              {profile.last_login
                ? new Date(profile.last_login).toLocaleString("ro-RO")
                : "Neînregistrat"}
            </div>
          </div>
        </div>

        <div className="profile-pref">
          Stil preferat:{" "}
          <strong>{profile.preferred_style || "Necompletat"}</strong>
        </div>

        <div className="profile-form">
          <label>Bio</label>
          <textarea value={bio} onChange={(e) => setBio(e.target.value)} />

          <label>Stil preferat</label>
          <select
            value={preferredStyle}
            onChange={(e) => setPreferredStyle(e.target.value)}
          >
            <option value="">Alege...</option>
            {styles.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <div className="profile-actions">
            <button onClick={save}>Salvează</button>
          </div>
        </div>

        <div className="profile-reviews">
          <div className="profile-reviews-head">
            <div className="profile-reviews-title">Recenziile mele</div>
            <div className="profile-reviews-count">{reviews.length}</div>
          </div>

          <div className="profile-reviews-list">
            {reviews.length ? (
              reviews
                .slice()
                .reverse()
                .map((r) => (
                  <div className="profile-review-item" key={r._id}>
                    <div className="profile-review-top">
                      <div className="profile-review-beer">
                        {r.beer?.name || `Băutură #${r.beer_id}`}
                      </div>
                      <div className="profile-review-rating">
                        {r.rating}/5
                      </div>
                    </div>

                    {r.review && (
                      <div className="profile-review-text">{r.review}</div>
                    )}

                    {Array.isArray(r.tastes) && r.tastes.length > 0 && (
                      <div className="profile-review-tags">
                        {r.tastes.map((t) => (
                          <span className="profile-tag" key={t}>
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
            ) : (
              <div className="profile-review-empty">
                Nu ai încă recenzii.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
