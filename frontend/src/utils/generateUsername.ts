
const adjectives = [
  'loud', 'quiet', 'brave', 'chill', 'mellow', 'wild', 'bright', 'calm', 'happy', 'sly'
];

const nouns = [
  'echo', 'wave', 'beat', 'pulse', 'note', 'vibe', 'tone', 'rhythm', 'voice', 'groove'
];

function rand(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function generateRandomUsername() {
  const adj = rand(adjectives);
  const noun = rand(nouns);
  const num = Math.floor(100 + Math.random() * 900); // 3-digit number
  return `${adj}_${noun}_${num}`; // example: "mellow_echo_423"
}
