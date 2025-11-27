const PRESET = { short: 300, medium: 700, long: 1200 };

export function sleep(ms = PRESET.medium) {
  return new Promise((r) => setTimeout(r, ms));
}

export const delay = {
  short: () => sleep(PRESET.short),
  medium: () => sleep(PRESET.medium),
  long: () => sleep(PRESET.long),
};

export default sleep;
