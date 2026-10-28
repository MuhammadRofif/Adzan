/**
 * Perhitungan waktu salat secara offline (tanpa API) — algoritma astronomis
 * standar (praytimes.org) dengan parameter Kemenag RI:
 *   Subuh 20°, Isya 18°, Ashar madzhab Syafi'i (bayangan = 1×), ihtiyat +2 menit.
 * Hasil bisa berbeda ±1–2 menit dari jadwal resmi Kemenag setempat.
 */

export const MASJID_LOCATION = {
  name: 'Loa Kulu, Kutai Kartanegara',
  lat: -0.5139,
  lng: 117.0206,
  /** Zona waktu masjid dalam jam (WITA = UTC+8) */
  tz: 8,
  tzLabel: 'WITA',
};

export const PRAYER_NAMES = ['Shubuh', 'Zhuhur', 'Ashar', 'Magrib', 'Isya'] as const;
export type PrayerName = (typeof PRAYER_NAMES)[number];

export interface PrayerTime {
  name: PrayerName;
  /** Waktu absolut (epoch) — aman dibandingkan dengan Date.now() di zona mana pun */
  at: Date;
  /** "HH:MM" dalam waktu masjid */
  label: string;
}

const FAJR_ANGLE = 20;
const ISHA_ANGLE = 18;
const IHTIYAT_MIN = 2;

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const sin = (d: number) => Math.sin(rad(d));
const cos = (d: number) => Math.cos(rad(d));
const tan = (d: number) => Math.tan(rad(d));
const arcsin = (x: number) => deg(Math.asin(x));
const arccos = (x: number) => deg(Math.acos(Math.max(-1, Math.min(1, x))));
const arctan2 = (y: number, x: number) => deg(Math.atan2(y, x));
const arccot = (x: number) => deg(Math.atan(1 / x));
const fix = (a: number, b: number) => { const r = a - b * Math.floor(a / b); return r < 0 ? r + b : r; };

function sunPosition(jd: number) {
  const D = jd - 2451545.0;
  const g = fix(357.529 + 0.98560028 * D, 360);
  const q = fix(280.459 + 0.98564736 * D, 360);
  const L = fix(q + 1.915 * sin(g) + 0.02 * sin(2 * g), 360);
  const e = 23.439 - 0.00000036 * D;
  const RA = arctan2(cos(e) * sin(L), cos(L)) / 15;
  return { declination: arcsin(sin(e) * sin(L)), equation: q / 15 - fix(RA, 24) };
}

function julian(year: number, month: number, day: number) {
  if (month <= 2) { year -= 1; month += 12; }
  const A = Math.floor(year / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + B - 1524.5;
}

/** Waktu (jam desimal, UTC+lng/15) lima salat untuk satu tanggal. */
function computeHours(year: number, month: number, day: number, lat: number, lng: number) {
  const jDate = julian(year, month, day) - lng / (15 * 24);
  const midDay = (t: number) => fix(12 - sunPosition(jDate + t).equation, 24);
  const sunAngleTime = (angle: number, t: number, ccw = false) => {
    const decl = sunPosition(jDate + t).declination;
    const noon = midDay(t);
    const h = arccos((-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))) / 15;
    return noon + (ccw ? -h : h);
  };
  const asrTime = (factor: number, t: number) => {
    const decl = sunPosition(jDate + t).declination;
    return sunAngleTime(-arccot(factor + tan(Math.abs(lat - decl))), t);
  };

  // Tebakan awal lalu satu iterasi penyempurnaan (seperti praytimes.org).
  let times = { fajr: 5, dhuhr: 12, asr: 13, maghrib: 18, isha: 18 };
  for (let i = 0; i < 2; i++) {
    const p = (h: number) => h / 24;
    times = {
      fajr: sunAngleTime(FAJR_ANGLE, p(times.fajr), true),
      dhuhr: midDay(p(times.dhuhr)),
      asr: asrTime(1, p(times.asr)),
      maghrib: sunAngleTime(0.833, p(times.maghrib)),
      isha: sunAngleTime(ISHA_ANGLE, p(times.isha)),
    };
  }
  return times;
}

/** Tanggal kalender (tahun, bulan, hari) di zona waktu masjid untuk sebuah instan. */
export function masjidDateParts(now: Date, tz = MASJID_LOCATION.tz) {
  const shifted = new Date(now.getTime() + tz * 3600_000);
  return { y: shifted.getUTCFullYear(), m: shifted.getUTCMonth() + 1, d: shifted.getUTCDate() };
}

export function getPrayerTimes(now: Date = new Date(), loc = MASJID_LOCATION, dayOffset = 0): PrayerTime[] {
  const { y, m, d } = masjidDateParts(new Date(now.getTime() + dayOffset * 86_400_000), loc.tz);
  const h = computeHours(y, m, d, loc.lat, loc.lng);
  const toTime = (name: PrayerName, hours: number): PrayerTime => {
    // jam desimal (zona lng/15) → menit lokal masjid, dibulatkan ke atas + ihtiyat
    const localMinutes = Math.ceil((hours + loc.tz - loc.lng / 15) * 60) + IHTIYAT_MIN;
    const at = new Date(Date.UTC(y, m - 1, d) + (localMinutes - loc.tz * 60) * 60_000);
    const hh = Math.floor(localMinutes / 60) % 24;
    const mm = localMinutes % 60;
    return { name, at, label: `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}` };
  };
  return [
    toTime('Shubuh', h.fajr),
    toTime('Zhuhur', h.dhuhr),
    toTime('Ashar', h.asr),
    toTime('Magrib', h.maghrib),
    toTime('Isya', h.isha),
  ];
}

/** Salat berikutnya setelah `now` (bisa Shubuh besok). */
export function getNextPrayer(now: Date = new Date()): PrayerTime {
  const today = getPrayerTimes(now);
  return today.find((p) => p.at.getTime() > now.getTime()) ?? getPrayerTimes(now, MASJID_LOCATION, 1)[0];
}

/** Nama hari (format jadwal petugas adzan) untuk tanggal masjid. */
export function masjidDayName(at: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', "Jum'at", 'Sabtu'];
  const shifted = new Date(at.getTime() + MASJID_LOCATION.tz * 3600_000);
  return days[shifted.getUTCDay()];
}

/** Tanggal Hijriah via Intl (kalender Umm al-Qura), mis. "6 Jumadilawal 1448 H". */
export function hijriDateLabel(now: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('id-ID-u-ca-islamic-umalqura', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Makassar',
    }).formatToParts(now);
    const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    return `${get('day')} ${get('month')} ${get('year').replace(/\D/g, '')} H`;
  } catch {
    return '';
  }
}

export function formatCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
}
