export const generateRandomUsername = (): string => {
  const adjectives: string[] = ["Batman", "xarvis", "pookie", "xem", "CM", "thief"];
  const nouns: string[] = ["Aca", "king", "Loard", "guest", "member"];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(1000 + Math.random() * 9000);

  return `${adj}_${noun}_${num}`;
};
