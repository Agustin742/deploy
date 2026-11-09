// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SignOutButton } from "./sign-out-button";

describe("SignOutButton", () => {
  afterEach(cleanup);

  it("signs out through the client and then goes to the sign-in page", async () => {
    const signOut = vi.fn().mockResolvedValue({ data: { success: true }, error: null });
    const goTo = vi.fn();
    render(<SignOutButton signOut={signOut} goTo={goTo} />);
    fireEvent.click(screen.getByRole("button", { name: "Salir" }));
    await waitFor(() => expect(goTo).toHaveBeenCalledWith("/ingresar"));
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it("stays on the page and re-enables the button when sign out fails", async () => {
    const signOut = vi.fn().mockRejectedValue(new Error("offline"));
    const goTo = vi.fn();
    render(<SignOutButton signOut={signOut} goTo={goTo} />);
    fireEvent.click(screen.getByRole("button", { name: "Salir" }));
    await waitFor(() => expect(signOut).toHaveBeenCalled());
    await waitFor(() =>
      expect((screen.getByRole("button", { name: "Salir" }) as HTMLButtonElement).disabled).toBe(false),
    );
    expect(goTo).not.toHaveBeenCalled();
  });
});
