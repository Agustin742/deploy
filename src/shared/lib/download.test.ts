// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { downloadText } from "./download";

describe("downloadText", () => {
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURL = vi.fn(() => "blob:mock");
    revokeObjectURL = vi.fn();
    Object.assign(URL, { createObjectURL, revokeObjectURL });
  });
  afterEach(() => vi.restoreAllMocks());

  it("downloads the text as a file through a temporary link and frees the blob URL", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.download).toBe("copia.json");
      expect(this.href).toBe("blob:mock");
      expect(this.isConnected).toBe(true);
    });

    expect(downloadText("copia.json", '{"a":1}', "application/json")).toBe(true);

    expect(click).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    expect(blob.type).toBe("application/json");
    expect(await blob.text()).toBe('{"a":1}');
    expect(document.querySelector("a[download]")).toBeNull();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  it("returns false instead of throwing when the browser cannot create the file", () => {
    createObjectURL.mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(downloadText("copia.json", "x", "application/json")).toBe(false);
  });
});
