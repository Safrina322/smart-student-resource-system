import { describe, it, expect, vi } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import StarRating from "./StarRating.jsx";

describe("StarRating", () => {
  it("renders as read-only when no onRate handler is given", () => {
    const { container } = render(<StarRating value={3} />);
    expect(container.querySelector(".star-rating.interactive")).toBeNull();
  });

  it("renders as interactive when onRate is given", () => {
    const { container } = render(<StarRating value={3} onRate={() => {}} />);
    expect(container.querySelector(".star-rating.interactive")).not.toBeNull();
  });

  it("fills stars up to the rounded value", () => {
    const { container } = render(<StarRating value={3.6} />);
    // 3.6 rounds to 4 filled stars
    expect(container.querySelectorAll("svg").length).toBe(5);
  });

  it("calls onRate with the clicked star's position", () => {
    const onRate = vi.fn();
    const { container } = render(<StarRating value={0} onRate={onRate} />);

    const stars = container.querySelectorAll("svg");
    fireEvent.click(stars[3]); // 4th star

    expect(onRate).toHaveBeenCalledWith(4);
  });
});
