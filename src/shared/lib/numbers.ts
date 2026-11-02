export const sum = (a: readonly unknown[]): number => a.reduce<number>((t, x) => t + (+(x as number) || 0), 0);
