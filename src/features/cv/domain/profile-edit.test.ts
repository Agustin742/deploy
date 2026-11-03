import { describe, expect, it } from "vitest";
import { blank } from "@/features/state/domain/state";
import type { AppState } from "@/features/state/domain/types";
import { parseBackupText, setCvText, setProfileField } from "./profile-edit";

const CV = "Ana Pérez\nFrontend developer con experiencia en React.";
const base = (): AppState => blank();

describe("setProfileField", () => {
  it("sets a text field", () => {
    expect(setProfileField(base(), "headline", "Frontend").profile.headline).toBe("Frontend");
  });

  it("sets the share-name flag", () => {
    expect(setProfileField(base(), "shareName", true).profile.shareName).toBe(true);
  });

  it("takes the name from the CV while it is automatic", () => {
    const s = setProfileField(base(), "cv", CV);
    expect(s.profile.cv).toBe(CV);
    expect(s.profile.name).toBe("Ana Pérez");
    expect(s.profile.nameAuto).toBe(true);
  });

  it("a typed name becomes manual and survives CV edits", () => {
    let s = setProfileField(base(), "name", "Anita");
    expect(s.profile.nameAuto).toBe(false);
    s = setProfileField(s, "cv", CV);
    expect(s.profile.name).toBe("Anita");
  });

  it("clearing the name returns to automatic detection on the next CV edit", () => {
    let s = setProfileField(base(), "name", "Anita");
    s = setProfileField(s, "name", "");
    expect(s.profile.nameAuto).toBe(true);
    expect(s.profile.name).toBe("");
    s = setProfileField(s, "cv", CV);
    expect(s.profile.name).toBe("Ana Pérez");
  });
});

describe("setCvText", () => {
  it("replaces the CV and syncs the name", () => {
    const s = setCvText(base(), CV);
    expect(s.profile.cv).toBe(CV);
    expect(s.profile.name).toBe("Ana Pérez");
  });
});

describe("parseBackupText", () => {
  it("parses JSON and returns null for anything else", () => {
    expect(parseBackupText('{"apps":[]}')).toEqual({ apps: [] });
    expect(parseBackupText("not json")).toBeNull();
    expect(parseBackupText("")).toBeNull();
  });
});
