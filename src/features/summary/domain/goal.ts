/** Maps the goal input to the stored goal: positive values up to 500, anything else clears it. */
export const parseGoal = (raw: string): { goal: number; goalSet: boolean } => {
  const g = +raw;
  const valid = g > 0;
  return { goal: valid ? Math.min(500, g) : 0, goalSet: valid };
};
