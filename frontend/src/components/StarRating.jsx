import { useState } from "react";
import { HiStar, HiOutlineStar } from "react-icons/hi2";
import "../styles/StarRating.css";

// Read-only when onRate is omitted (e.g. showing an average); interactive
// when provided (lets the user click a star to submit their own rating).
function StarRating({ value = 0, onRate, size = "1rem" }) {
  const [hovered, setHovered] = useState(0);
  const interactive = Boolean(onRate);
  const displayValue = interactive && hovered ? hovered : value;

  return (
    <span className={`star-rating ${interactive ? "interactive" : ""}`} style={{ fontSize: size }}>
      {[1, 2, 3, 4, 5].map((star) =>
        star <= Math.round(displayValue) ? (
          <HiStar
            key={star}
            onClick={() => onRate?.(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
          />
        ) : (
          <HiOutlineStar
            key={star}
            onClick={() => onRate?.(star)}
            onMouseEnter={() => interactive && setHovered(star)}
            onMouseLeave={() => interactive && setHovered(0)}
          />
        )
      )}
    </span>
  );
}

export default StarRating;
