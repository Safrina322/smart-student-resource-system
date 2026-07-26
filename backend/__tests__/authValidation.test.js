import { describe, it, expect } from "vitest";
import { registerSchema, loginSchema, updateProfileSchema } from "../validation/authValidation.js";

describe("registerSchema", () => {
  it("accepts a valid registration payload", () => {
    const result = registerSchema.safeParse({
      body: { username: "safrina", email: "safrina@example.com", password: "password123" },
    });
    expect(result.success).toBe(true);
  });

  it("rejects a username shorter than 3 characters", () => {
    const result = registerSchema.safeParse({
      body: { username: "ab", email: "safrina@example.com", password: "password123" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({
      body: { username: "safrina", email: "not-an-email", password: "password123" },
    });
    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 6 characters", () => {
    const result = registerSchema.safeParse({
      body: { username: "safrina", email: "safrina@example.com", password: "123" },
    });
    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts a valid login payload", () => {
    const result = loginSchema.safeParse({ body: { username: "safrina", password: "anything" } });
    expect(result.success).toBe(true);
  });

  it("rejects an empty username", () => {
    const result = loginSchema.safeParse({ body: { username: "", password: "anything" } });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema semester coercion", () => {
  it("treats an empty-string semester as omitted rather than coercing to 0", () => {
    const result = updateProfileSchema.safeParse({ body: { semester: "" } });
    expect(result.success).toBe(true);
    expect(result.data.body.semester).toBeUndefined();
  });

  it("coerces a numeric string semester to a number", () => {
    const result = updateProfileSchema.safeParse({ body: { semester: "4" } });
    expect(result.success).toBe(true);
    expect(result.data.body.semester).toBe(4);
  });

  it("rejects a semester outside the valid range", () => {
    const result = updateProfileSchema.safeParse({ body: { semester: "13" } });
    expect(result.success).toBe(false);
  });
});
