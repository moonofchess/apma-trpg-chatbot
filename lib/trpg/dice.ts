export type DiceRollResult = {
  expression: string;
  rolls: number[];
  modifier: number;
  total: number;
  reason: string;
};

export function rollDice(
  count: number,
  sides: number,
  modifier = 0,
  reason = "판정",
): DiceRollResult {
  const safeCount = Math.max(1, Math.min(count, 20));
  const safeSides = Math.max(2, Math.min(sides, 100));

  const rolls = Array.from(
    { length: safeCount },
    () => Math.floor(Math.random() * safeSides) + 1,
  );

  const sum = rolls.reduce((acc, value) => acc + value, 0);
  const modifierText =
    modifier > 0 ? `+${modifier}` : modifier < 0 ? `${modifier}` : "";
  const expression = `${safeCount}d${safeSides}${modifierText}`;

  return {
    expression,
    rolls,
    modifier,
    total: sum + modifier,
    reason,
  };
}
