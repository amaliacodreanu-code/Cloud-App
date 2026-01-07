import React from "react";

const CustomRating = ({ rating, onChange }) => {
  const handleStarClick = (index) => {
    if (onChange) {
      onChange(index + 1);
    }
  };

  return (
    <div style={{ display: "flex", cursor: "pointer" }}>
      {Array.from({ length: 5 }, (_, index) => (
        <i
          key={index}
          className={`fa fa-star${index < rating ? "" : "-o"}`}
          style={{
            color: index < rating ? "#ffd700" : "#ddd",
            fontSize: "24px",
            marginRight: "5px",
          }}
          onClick={() => handleStarClick(index)}
        ></i>
      ))}
    </div>
  );
};

export default CustomRating;