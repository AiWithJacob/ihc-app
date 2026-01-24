/**
 * Format daty: DD.MM.RR (np. 24.01.25)
 * @param {string|Date} val - YYYY-MM-DD, ISO z czasem lub obiekt Date
 * @returns {string}
 */
export function formatDateDDMMRR(val) {
  if (val == null || val === "") return "";
  const d = typeof val === "string"
    ? new Date(val.length === 10 ? val + "T12:00:00" : val)
    : val;
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const rr = String(d.getFullYear()).slice(-2);
  return `${dd}.${mm}.${rr}`;
}

/**
 * Format daty i czasu: DD.MM.RR, HH:MM:SS (np. 24.01.25, 14:30:00)
 * @param {string|Date} val
 * @returns {string}
 */
export function formatDateTimeDDMMRR(val) {
  if (val == null || val === "") return "-";
  const d = new Date(val);
  if (isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const rr = String(d.getFullYear()).slice(-2);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${dd}.${mm}.${rr}, ${h}:${m}:${s}`;
}
