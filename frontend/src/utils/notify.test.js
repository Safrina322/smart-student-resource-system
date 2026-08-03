import { describe, it, expect, vi } from "vitest";
import toast from "react-hot-toast";
import { notify } from "./notify.js";

vi.mock("react-hot-toast", () => {
  const fn = vi.fn();
  fn.success = vi.fn();
  fn.error = vi.fn();
  return { default: fn };
});

describe("notify", () => {
  it("success() calls toast.success with the message", () => {
    notify.success("Saved successfully");
    expect(toast.success).toHaveBeenCalledWith("Saved successfully");
  });

  it("error() calls toast.error with the message", () => {
    notify.error("Something went wrong");
    expect(toast.error).toHaveBeenCalledWith("Something went wrong");
  });

  it("info() calls the base toast function with the message", () => {
    notify.info("Just so you know");
    expect(toast).toHaveBeenCalledWith("Just so you know");
  });
});
