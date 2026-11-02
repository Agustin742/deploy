export interface Debounced<A extends unknown[]> {
  (...args: A): void;
  /** Drops the pending call, if any. */
  cancel(): void;
}

export const debounce = <A extends unknown[]>(fn: (...args: A) => void, ms: number): Debounced<A> => {
  let t: ReturnType<typeof setTimeout> | undefined;
  const debounced = (...args: A): void => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
  debounced.cancel = (): void => {
    clearTimeout(t);
    t = undefined;
  };
  return debounced;
};
