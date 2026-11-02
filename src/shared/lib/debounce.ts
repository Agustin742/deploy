export const debounce = <A extends unknown[]>(fn: (...args: A) => void, ms: number) => {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: A): void => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
};
