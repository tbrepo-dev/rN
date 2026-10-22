// Secret level-select codes. On the title screen, tap the "BILLY BUBS" title five times, then punch in a code.
export const LEVEL_CODES = {
  1776: 1, // Billy's Holler
  5150: 2, // Crash-Landed
  1492: 3, // Dark Ages
  8008: 4, // The Wizard's Fridge
  3141: 5, // The Pagoda
  6660: 6, // Hell
  4200: 7, // Big Al's Liquor Store
  1337: 8, // The Hive
  2718: 10, // The Egg Chamber (the secret level inside the Hive)
  1999: 9, // The Hillbilly Cage Match
};

export const levelForCode = (code) => LEVEL_CODES[String(code)] ?? null;
