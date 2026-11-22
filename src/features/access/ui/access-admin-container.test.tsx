// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const add = vi.fn();
const remove = vi.fn();
vi.mock("../infrastructure/admin-actions", () => ({
  addAllowedEmail: (...args: unknown[]) => add(...args),
  removeAllowedEmail: (...args: unknown[]) => remove(...args),
}));

import { AccessAdminContainer } from "./access-admin-container";

const entry = (email: string) => ({ email, addedBy: "owner@example.com", createdAt: "2026-11-22T00:00:00.000Z" });

describe("AccessAdminContainer", () => {
  beforeEach(() => {
    add.mockReset();
    remove.mockReset();
  });
  afterEach(cleanup);

  it("adds an email and shows the list returned by the server", async () => {
    add.mockResolvedValue({ ok: true, emails: [entry("ana@example.com")] });
    render(<AccessAdminContainer owners={["owner@example.com"]} initialEmails={[]} />);
    fireEvent.change(screen.getByLabelText("Dar acceso a un email"), { target: { value: "Ana@Example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Dar acceso" }));
    await waitFor(() => expect(screen.getByText("ana@example.com")).toBeTruthy());
    expect(add).toHaveBeenCalledWith("Ana@Example.com");
  });

  it("removes an email", async () => {
    remove.mockResolvedValue({ ok: true, emails: [] });
    render(<AccessAdminContainer owners={[]} initialEmails={[entry("ana@example.com")]} />);
    fireEvent.click(screen.getByRole("button", { name: "Quitar acceso a ana@example.com" }));
    await waitFor(() => expect(screen.queryByText("ana@example.com")).toBeNull());
    expect(remove).toHaveBeenCalledWith("ana@example.com");
  });

  it("shows the server error and keeps the list", async () => {
    add.mockResolvedValue({ ok: false, error: "invalid_email" });
    render(<AccessAdminContainer owners={[]} initialEmails={[entry("ana@example.com")]} />);
    fireEvent.change(screen.getByLabelText("Dar acceso a un email"), { target: { value: "x@y.zz" } });
    fireEvent.click(screen.getByRole("button", { name: "Dar acceso" }));
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("no parece válido"));
    expect(screen.getByText("ana@example.com")).toBeTruthy();
  });
});
