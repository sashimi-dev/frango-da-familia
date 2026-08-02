// Converte os "horarios" (texto livre em PT-BR) em uma agenda estruturada
// e calcula se está aberto agora no horário de Tocantins (America/Araguaina).

type Interval = { start: number; end: number }; // minutos desde 00:00
type Schedule = Record<number, Interval[]>; // 0=domingo ... 6=sábado

const DIAS: Record<string, number> = {
  domingo: 0, segunda: 1, terca: 2, quarta: 3,
  quinta: 4, sexta: 5, sabado: 6,
};

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/-feira/g, '')
    .trim();
}

function diasToWeekdays(dias: string): number[] {
  const t = normalize(dias);
  if (t.includes('todos')) return [0, 1, 2, 3, 4, 5, 6];
  if (t.includes(' a ')) {
    const [a, b] = t.split(' a ').map((x) => x.trim());
    const start = DIAS[a], end = DIAS[b];
    if (start === undefined || end === undefined) return [];
    const out: number[] = [];
    for (let i = start; i !== (end + 1) % 7; i = (i + 1) % 7) out.push(i);
    return out;
  }
  const parts = t.split(/,| e /).map((x) => x.trim()).filter(Boolean);
  return parts.map((p) => DIAS[p]).filter((n) => n !== undefined);
}

function parseInterval(horario: string): Interval | null {
  const t = normalize(horario);
  if (t.includes('fechado')) return null;
  const m = t.match(/(\d{1,2})(?:[:h](\d{2})?)?\s*(?:as|a|-|ate)\s*(\d{1,2})(?:[:h](\d{2})?)?/);
  if (!m) return null;
  const start = parseInt(m[1], 10) * 60 + (m[2] ? parseInt(m[2], 10) : 0);
  const end = parseInt(m[3], 10) * 60 + (m[4] ? parseInt(m[4], 10) : 0);
  return { start, end };
}

export function buildSchedule(horarios: { dias: string; horario: string }[]): Schedule {
  const sched: Schedule = {};
  for (const h of horarios) {
    const interval = parseInterval(h.horario);
    if (!interval) continue;
    for (const wd of diasToWeekdays(h.dias)) {
      (sched[wd] ||= []).push(interval);
    }
  }
  return sched;
}

// Weekday atual em Tocantins (0=domingo).
export function weekdayInTocantins(now = new Date()): number {
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const wd = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Araguaina', weekday: 'short' }).format(now);
  return wdMap[wd];
}

// Texto do horário de hoje (ex.: "11h às 15h" ou "Fechado").
export function todayHorario(horarios: { dias: string; horario: string }[], now = new Date()): string {
  const wd = weekdayInTocantins(now);
  for (const h of horarios) {
    if (diasToWeekdays(h.dias).includes(wd)) return h.horario;
  }
  return 'Fechado';
}

// Gera openingHoursSpecification (schema.org) a partir da agenda.
export function openingHoursSpec(sched: Schedule) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const hhmm = (mins: number) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
  const specs: { '@type': string; dayOfWeek: string; opens: string; closes: string }[] = [];
  for (let wd = 0; wd < 7; wd++) {
    for (const i of sched[wd] || []) {
      specs.push({ '@type': 'OpeningHoursSpecification', dayOfWeek: days[wd], opens: hhmm(i.start), closes: hhmm(i.end) });
    }
  }
  return specs;
}

// Estado calculado no build (fallback). O cliente recalcula no navegador.
export function isOpenNow(sched: Schedule, now = new Date()): boolean {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Araguaina', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now);
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const wd = wdMap[parts.find((p) => p.type === 'weekday')!.value];
  let hour = parseInt(parts.find((p) => p.type === 'hour')!.value, 10);
  if (hour === 24) hour = 0;
  const min = parseInt(parts.find((p) => p.type === 'minute')!.value, 10);
  const mins = hour * 60 + min;
  return (sched[wd] || []).some((i) => mins >= i.start && mins < i.end);
}
