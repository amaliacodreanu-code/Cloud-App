import React from "react";

export default function CustomRating({ rating, setRating }) {
  return (
    <div style={{ display: "flex", gap: 8, fontSize: 28, userSelect: "none" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          role="button"
          aria-label={`${n} stars`}
          onClick={() => setRating(n)}
          style={{
            cursor: "pointer",
            color: n <= (Number(rating) || 0) ? "#ffb703" : "rgba(255,255,255,0.25)",
            transition: "transform 120ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.12)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          ★
        </span>
      ))}
    </div>
  );
}
