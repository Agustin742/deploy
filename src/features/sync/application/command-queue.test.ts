import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ApplyResult, Command } from "../domain/commands";
import { createCommandQueue, DEBOUNCE_MS } from "./command-queue";

const ok: ApplyResult = { ok: true };
const profile = (fields: Record<string, string>): Command => ({ type: "profile.setFields", fields });
const appFields = (id: string, fields: Record<string, string>): Command => ({ type: "app.setFields", id, fields });
const remove = (id: string): Command => ({ type: "app.remove", id });

function setup(send: (c: Command[]) => Promise<ApplyResult> = async () => ok) {
  const sendMock = vi.fn(send);
  const onFailure = vi.fn();
  const onUnauthorized = vi.fn();
  const queue = createCommandQueue({ send: sendMock, onFailure, onUnauthorized });
  return { queue, send: sendMock, onFailure, onUnauthorized };
}

/** A send whose result the test settles by hand. */
function deferredSend() {
  const pending: Array<(r: ApplyResult) => void> = [];
  const send = vi.fn(
    () =>
      new Promise<ApplyResult>((resolve) => {
        pending.push(resolve);
      }),
  );
  return { send, resolveNext: (r: ApplyResult = ok) => pending.shift()?.(r) };
}

describe("command queue", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  describe("debounced edits", () => {
    it("coalesces consecutive edits of the same field into one patch", async () => {
      const { queue, send } = setup();
      queue.enqueue([profile({ cv: "a" })], { debounce: true });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 100);
      queue.enqueue([profile({ cv: "ab" })], { debounce: true });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 1);
      expect(send).not.toHaveBeenCalled();
      await vi.advanceTimersByTimeAsync(1);
      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith([profile({ cv: "ab" })]);
    });

    it("keeps different entities as separate commands, in the order they were first edited", async () => {
      const { queue, send } = setup();
      queue.enqueue([appFields("a2", { estado: "x" })], { debounce: true });
      queue.enqueue([appFields("a1", { estado: "y" })], { debounce: true });
      queue.enqueue([appFields("a2", { estado: "z" })], { debounce: true });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith([appFields("a2", { estado: "z" }), appFields("a1", { estado: "y" })]);
    });

    it("merges different fields of the same row into one patch", async () => {
      const { queue, send } = setup();
      queue.enqueue([appFields("a1", { comentarios: "x" })], { debounce: true });
      queue.enqueue([appFields("a1", { proximos: "y" })], { debounce: true });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(send).toHaveBeenCalledWith([appFields("a1", { comentarios: "x", proximos: "y" })]);
    });

    it("merges nested ficha patches and keeps the last value of last-wins commands", async () => {
      const { queue, send } = setup();
      queue.enqueue([{ type: "app.setFields", id: "a1", ficha: { industria: "A" } }], { debounce: true });
      queue.enqueue([{ type: "app.setFields", id: "a1", ficha: { cultura: "B" }, fields: { jd: "j" } }], { debounce: true });
      queue.enqueue([{ type: "goal.set", goal: 1, goalSet: true }], { debounce: true });
      queue.enqueue([{ type: "goal.set", goal: 2, goalSet: true }], { debounce: true });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(send).toHaveBeenCalledWith([
        { type: "app.setFields", id: "a1", fields: { jd: "j" }, ficha: { industria: "A", cultura: "B" } },
        { type: "goal.set", goal: 2, goalSet: true },
      ]);
    });

    it("sends a command that cannot be coalesced right away even when marked as a text edit", async () => {
      const { queue, send } = setup();
      queue.enqueue([remove("a1")], { debounce: true });
      await vi.advanceTimersByTimeAsync(0);
      expect(send).toHaveBeenCalledWith([remove("a1")]);
    });
  });

  describe("discrete commands", () => {
    it("send immediately and flush the pending edits first, preserving order", async () => {
      const { queue, send } = setup();
      queue.enqueue([appFields("a1", { jd: "texto" })], { debounce: true });
      queue.enqueue([remove("a1")]);
      await vi.advanceTimersByTimeAsync(0);
      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenCalledWith([appFields("a1", { jd: "texto" }), remove("a1")]);
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 2);
      expect(send).toHaveBeenCalledTimes(1);
    });

    it("sends nothing for an empty list", async () => {
      const { queue, send } = setup();
      queue.enqueue([]);
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(send).not.toHaveBeenCalled();
    });
  });

  describe("one batch in flight at a time", () => {
    it("holds later commands until the previous batch finished, then sends them together in order", async () => {
      const { send, resolveNext } = deferredSend();
      const queue = createCommandQueue({ send, onFailure: vi.fn(), onUnauthorized: vi.fn() });
      queue.enqueue([remove("a1")]);
      queue.enqueue([remove("a2")]);
      queue.enqueue([remove("a3")]);
      await vi.advanceTimersByTimeAsync(0);
      expect(send).toHaveBeenCalledTimes(1);
      expect(send).toHaveBeenLastCalledWith([remove("a1")]);
      resolveNext();
      await vi.advanceTimersByTimeAsync(0);
      expect(send).toHaveBeenCalledTimes(2);
      expect(send).toHaveBeenLastCalledWith([remove("a2"), remove("a3")]);
    });

    it("splits an oversized backlog into batches under the server limit, in order", async () => {
      const { queue, send } = setup();
      const many = Array.from({ length: 450 }, (_, i) => remove(`a${i}`));
      queue.enqueue(many);
      await vi.advanceTimersByTimeAsync(0);
      expect(send.mock.calls.map(([batch]) => batch.length)).toEqual([200, 200, 50]);
      expect(send.mock.calls.flatMap(([batch]) => batch)).toEqual(many);
    });
  });

  describe("failures", () => {
    it("reports a rejected batch once, drops what was queued behind it and accepts new commands", async () => {
      const { send, resolveNext } = deferredSend();
      const onFailure = vi.fn();
      const queue = createCommandQueue({ send, onFailure, onUnauthorized: vi.fn() });
      queue.enqueue([remove("a1")]);
      queue.enqueue([remove("a2")]);
      queue.enqueue([appFields("a3", { jd: "x" })], { debounce: true });
      await vi.advanceTimersByTimeAsync(0);
      resolveNext({ ok: false, error: "conflict", index: 0 });
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 2);
      expect(onFailure).toHaveBeenCalledTimes(1);
      expect(onFailure).toHaveBeenCalledWith("conflict");
      expect(send).toHaveBeenCalledTimes(1);
      queue.enqueue([remove("a4")]);
      await vi.advanceTimersByTimeAsync(0);
      expect(send).toHaveBeenCalledTimes(2);
      expect(send).toHaveBeenLastCalledWith([remove("a4")]);
    });

    it("treats a network error like a failed batch", async () => {
      const { queue, onFailure } = setup(async () => {
        throw new Error("offline");
      });
      queue.enqueue([remove("a1")]);
      await vi.advanceTimersByTimeAsync(0);
      expect(onFailure).toHaveBeenCalledWith("network");
    });

    it("redirects instead of reporting when the session is gone", async () => {
      const { queue, onFailure, onUnauthorized } = setup(async () => ({ ok: false, error: "unauthorized" }));
      queue.enqueue([remove("a1")]);
      await vi.advanceTimersByTimeAsync(0);
      expect(onUnauthorized).toHaveBeenCalledTimes(1);
      expect(onFailure).not.toHaveBeenCalled();
    });
  });

  describe("flush", () => {
    it("sends pending edits now and resolves true once everything was applied", async () => {
      const { queue, send } = setup();
      queue.enqueue([profile({ cv: "x" })], { debounce: true });
      await expect(queue.flush()).resolves.toBe(true);
      expect(send).toHaveBeenCalledWith([profile({ cv: "x" })]);
      await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
      expect(send).toHaveBeenCalledTimes(1);
    });

    it("waits for a batch already in flight", async () => {
      const { send, resolveNext } = deferredSend();
      const queue = createCommandQueue({ send, onFailure: vi.fn(), onUnauthorized: vi.fn() });
      queue.enqueue([remove("a1")]);
      let finished = false;
      void queue.flush().then(() => {
        finished = true;
      });
      await vi.advanceTimersByTimeAsync(0);
      expect(finished).toBe(false);
      resolveNext();
      await vi.advanceTimersByTimeAsync(0);
      expect(finished).toBe(true);
    });

    it("resolves false when a batch failed", async () => {
      const { queue } = setup(async () => ({ ok: false, error: "failed" }));
      queue.enqueue([remove("a1")]);
      await expect(queue.flush()).resolves.toBe(false);
    });

    it("resolves true right away when there is nothing to send", async () => {
      const { queue, send } = setup();
      await expect(queue.flush()).resolves.toBe(true);
      expect(send).not.toHaveBeenCalled();
    });
  });

  it("reports whether edits are still waiting", async () => {
    const { queue } = setup();
    expect(queue.hasPending()).toBe(false);
    queue.enqueue([profile({ cv: "x" })], { debounce: true });
    expect(queue.hasPending()).toBe(true);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(queue.hasPending()).toBe(false);
  });

  it("discard drops pending and queued commands without reporting", async () => {
    const { queue, send, onFailure } = setup();
    queue.enqueue([profile({ cv: "x" })], { debounce: true });
    queue.discard();
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(send).not.toHaveBeenCalled();
    expect(onFailure).not.toHaveBeenCalled();
  });
});
