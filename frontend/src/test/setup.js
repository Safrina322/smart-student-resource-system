import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// Without vitest's `globals: true`, @testing-library/react's automatic
// afterEach-cleanup detection doesn't register, so every test's render()
// output silently accumulated in the same document instead of being torn
// down - harmless for tests asserting on unique text, but a real bug for
// anything querying by role/class shared across multiple tests in one file.
afterEach(() => {
  cleanup();
});
