const PALETTE = ['#D4AF37', '#3B0764', '#0F172A', '#0E7490', '#9D174D', '#166534'];

export function colorFor(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (h * 31 + id.charCodeAt(i)) >>> 0;
  }
  return PALETTE[h % PALETTE.length];
}