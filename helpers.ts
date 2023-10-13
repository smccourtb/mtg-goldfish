export const pickRandomIndex = (array: number[] | string[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

export const keywordAbilities = [
  "lifelink",
  "reach",
  "deathtouch",
  "hexproof",
  "indestructible",
  "menace",
  "protection",
  "trample",
  "flying",
  "infect",
  "toxic",
];
