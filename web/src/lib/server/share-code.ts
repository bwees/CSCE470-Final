export const alphanumeric = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function generateShareCode(): string {
  let out = '';
  for (let i = 0; i < 4; i++) {
    out += alphanumeric[Math.floor(Math.random() * alphanumeric.length)];
  }
  return out;
}
