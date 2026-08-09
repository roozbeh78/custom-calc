export const fmt = (n, d = 0) =>
  !isFinite(n) ? "—" : n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

export const pct = (n) => (isFinite(n) ? (n * 100).toFixed(1) + "%" : "—");

export const parse = (s) => {
  const v = parseFloat(String(s).replace(/[^\d.-]/g, ""));
  return isFinite(v) ? v : 0;
};
