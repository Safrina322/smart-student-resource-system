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
    <span
      className={`star-rating ${interactive ? "interactive" : ""}`}
      style={{ fontSize: size }}
      role={interactive ? undefined : "img"}
      aria-label={interactive ? undefined : `Rated ${value} out of 5`}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        const StarIcon = star <= Math.round(displayValue) ? HiStar : HiOutlineStar;
        if (!interactive) return <StarIcon key={star} aria-hidden="true" />;

        return (
          <button
            key={star}
            type="button"
            className="star-rating-star"
            aria-label={`Rate ${star} out of 5`}
            onClick={() => onRate(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onFocus={() => setHovered(star)}
            onBlur={() => setHovered(0)}
          >
            <StarIcon aria-hidden="true" />
          </button>
        );
      })}
    </span>
  );
}

export default StarRating;
