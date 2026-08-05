// Lógica de "que dia é hoje" no fuso de Tocantins (America/Araguaina)
// + feriados nacionais do Brasil (incluindo os móveis, calculados pela Páscoa).
// Usada NO NAVEGADOR para decidir disponibilidade de produtos e horários.

export type Today = { wd: number; mins: number; ymd: string; y: number; m: number; d: number };

// Data/hora atual em Tocantins. Aceita override ?data=AAAA-MM-DD (para testes/QA).
export function todayTO(now = new Date()): Today {
  try {
    const q = new URLSearchParams(location.search).get('data');
    if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) {
      const [y, m, d] = q.split('-').map(Number);
      const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
      return { wd, mins: 12 * 60, ymd: q, y, m, d };
    }
  } catch {}
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Araguaina', year: 'numeric', month: '2-digit', day: '2-digit',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((x) => x.type === t)?.value || '';
  const wdMap: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const y = +get('year'), m = +get('month'), d = +get('day');
  let h = +get('hour'); if (h === 24) h = 0;
  const mins = h * 60 + (+get('minute'));
  return { wd: wdMap[get('weekday')] ?? 0, mins, ymd: `${get('year')}-${get('month')}-${get('day')}`, y, m, d };
}

// Domingo de Páscoa (algoritmo de Meeus/Butcher).
export function easter(year: number): { m: number; d: number } {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const dd = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - dd - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const mth = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * mth + 114) / 31);
  const day = ((h + l - 7 * mth + 114) % 31) + 1;
  return { m: month, d: day };
}

const pad = (n: number) => String(n).padStart(2, '0');
function addDays(y: number, m: number, d: number, delta: number): string {
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

// Feriados NACIONAIS do Brasil (com os móveis) para um ano -> Set de 'AAAA-MM-DD'.
export function nationalHolidays(year: number): Set<string> {
  const s = new Set<string>();
  const fixed = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '11-20', '12-25'];
  for (const f of fixed) s.add(`${year}-${f}`);
  const e = easter(year);
  s.add(addDays(year, e.m, e.d, -48)); // Segunda de Carnaval
  s.add(addDays(year, e.m, e.d, -47)); // Terça de Carnaval
  s.add(addDays(year, e.m, e.d, -2));  // Sexta-feira Santa
  s.add(addDays(year, e.m, e.d, 60));  // Corpus Christi
  return s;
}

// É feriado? (feriados nacionais opcionais + lista de datas extras 'AAAA-MM-DD')
export function isHoliday(ymd: string, opts: { extra?: string[]; useNational?: boolean }): boolean {
  const extra = (opts.extra || []).map((x) => (x || '').trim());
  if (extra.includes(ymd)) return true;
  if (opts.useNational !== false) {
    if (nationalHolidays(+ymd.slice(0, 4)).has(ymd)) return true;
  }
  return false;
}

// É dia de menu completo? (sábado, domingo OU feriado)
export function isFullMenuDay(t: Today, opts: { extra?: string[]; useNational?: boolean }): { fullMenu: boolean; holiday: boolean } {
  const holiday = isHoliday(t.ymd, opts);
  return { fullMenu: t.wd === 0 || t.wd === 6 || holiday, holiday };
}
