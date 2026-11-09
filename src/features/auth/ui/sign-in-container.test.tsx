// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const magicLink = vi.fn();
const social = vi.fn();
vi.mock("./auth-client", () => ({
  authClient: {
    signIn: {
      magicLink: (...args: unknown[]) => magicLink(...args),
      social: (...args: unknown[]) => social(...args),
    },
  },
}));

import { SignInContainer } from "./sign-in-container";

const email = () => screen.getByLabelText("Email");
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Enviarme un link" }));

describe("SignInContainer", () => {
  beforeEach(() => {
    magicLink.mockReset().mockResolvedValue({ data: { status: true }, error: null });
    social.mockReset().mockResolvedValue({ data: null, error: null });
  });
  afterEach(cleanup);

  it("requests a magic link for the typed email and shows the sent state", async () => {
    render(<SignInContainer googleEnabled={false} />);
    fireEvent.change(email(), { target: { value: "ana@example.com" } });
    submit();
    await waitFor(() => expect(screen.getByRole("status").textContent).toContain("Te enviamos un link"));
    expect(magicLink).toHaveBeenCalledWith({ email: "ana@example.com", callbackURL: "/app" });
    expect(screen.getByRole("status").textContent).toContain("ana@example.com");
  });

  it("does not call the server for an empty email", () => {
    render(<SignInContainer googleEnabled={false} />);
    submit();
    expect(magicLink).not.toHaveBeenCalled();
  });

  it("shows an error and keeps the form when the request fails", async () => {
    magicLink.mockResolvedValue({ data: null, error: { message: "boom" } });
    render(<SignInContainer googleEnabled={false} />);
    fireEvent.change(email(), { target: { value: "ana@example.com" } });
    submit();
    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("No pudimos enviar el link"));
    expect((email() as HTMLInputElement).value).toBe("ana@example.com");
  });

  it("shows an error when the request throws", async () => {
    magicLink.mockRejectedValue(new Error("network"));
    render(<SignInContainer googleEnabled={false} />);
    fireEvent.change(email(), { target: { value: "ana@example.com" } });
    submit();
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  });

  it("hides the Google button and explains why when Google is not configured", () => {
    render(<SignInContainer googleEnabled={false} />);
    expect(screen.queryByRole("button", { name: "Continuar con Google" })).toBeNull();
    expect(screen.getByText(/Google todavía no está disponible/)).toBeTruthy();
  });

  it("starts the Google flow towards /app when Google is configured", () => {
    render(<SignInContainer googleEnabled />);
    fireEvent.click(screen.getByRole("button", { name: "Continuar con Google" }));
    expect(social).toHaveBeenCalledWith({ provider: "google", callbackURL: "/app" });
    expect(screen.queryByText(/Google todavía no está disponible/)).toBeNull();
  });
});
