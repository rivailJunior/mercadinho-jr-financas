import { formatCurrency } from "@/lib/formatCurrency";
import type { WeeklyDay } from "@/types/cashClosing";

const SVG_WIDTH = 340;
const SVG_HEIGHT = 100;
const PADDING_TOP = 15;
const PADDING_BOTTOM = 10;
const CHART_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;

const buildPoints = (values: number[], maxValue: number) => {
  const step = SVG_WIDTH / (values.length - 1);
  return values.map((v, i) => ({
    x: i * step,
    y: PADDING_TOP + CHART_HEIGHT - (v / maxValue) * CHART_HEIGHT,
  }));
};

const buildSmoothPath = (points: { x: number; y: number }[]) => {
  if (points.length < 2) return "";
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const cpx = (prev.x + curr.x) / 2;
    d += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
  }
  return d;
};

const buildAreaPath = (points: { x: number; y: number }[]) => {
  const line = buildSmoothPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${line} L ${last.x},${SVG_HEIGHT} L ${first.x},${SVG_HEIGHT} Z`;
};

interface WeeklyChartProps {
  data: WeeklyDay[];
}

export const WeeklyChart = ({ data }: WeeklyChartProps) => {
  if (data.length < 2) return null;

  const todayIndex = data.length - 1;
  const maxValue = Math.max(...data.map((d) => d.valor), ...data.map((d) => d.saida), 1);

  const mediaEntradas = Math.round(data.reduce((acc, d) => acc + d.valor, 0) / data.length);
  const mediaSaidas = Math.round(data.reduce((acc, d) => acc + d.saida, 0) / data.length);

  const entradaPoints = buildPoints(
    data.map((d) => d.valor),
    maxValue,
  );
  const saidaPoints = buildPoints(
    data.map((d) => d.saida),
    maxValue,
  );

  const entradaLine = buildSmoothPath(entradaPoints);
  const entradaArea = buildAreaPath(entradaPoints);
  const saidaLine = buildSmoothPath(saidaPoints);
  const saidaArea = buildAreaPath(saidaPoints);

  const todayEntrada = entradaPoints[todayIndex];
  const todaySaida = saidaPoints[todayIndex];

  return (
    <section
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft"
      aria-labelledby="weekly-chart-title"
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4
            id="weekly-chart-title"
            className="text-xs font-bold uppercase tracking-wide text-slate-700"
          >
            Como foi sua semana
          </h4>
          <p className="text-xs text-slate-400">Movimento dos últimos 7 dias</p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="tabular-nums text-[11px] font-black text-indigo-600">
            Entrada: {formatCurrency(mediaEntradas)}
          </span>
          <span className="tabular-nums text-[11px] font-black text-rose-500">
            Saída: {formatCurrency(mediaSaidas)}
          </span>
        </div>
      </div>

      <div className="relative pb-1 pt-2">
        <svg
          className="h-28 w-full overflow-visible"
          fill="none"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          aria-label="Gráfico de curvas do movimento semanal"
          role="img"
        >
          <defs>
            <linearGradient id="entradaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5b72ff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#5b72ff" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="saidaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff6584" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#ff6584" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Entrada (blue) */}
          <path d={entradaArea} fill="url(#entradaGrad)" />
          <path d={entradaLine} stroke="#5b72ff" strokeLinecap="round" strokeWidth="3" />

          {/* Saída (red) */}
          <path d={saidaArea} fill="url(#saidaGrad)" />
          <path
            d={saidaLine}
            stroke="#ff6584"
            strokeLinecap="round"
            strokeWidth="3"
            strokeDasharray="6 3"
          />

          {/* Today dot — Entrada */}
          <circle
            cx={todayEntrada.x}
            cy={todayEntrada.y}
            r="6"
            className="fill-white stroke-indigo-600 stroke-3"
          />
          <circle cx={todayEntrada.x} cy={todayEntrada.y} r="2.5" className="fill-indigo-600" />
          <g
            transform={`translate(${Math.min(todayEntrada.x - 26, SVG_WIDTH - 52)}, ${todayEntrada.y - 22})`}
          >
            <rect width="52" height="16" rx="8" fill="#1e293b" />
            <text x="26" y="12" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
              {formatCurrency(data[todayIndex].valor)}
            </text>
          </g>

          {/* Today dot — Saída */}
          <circle
            cx={todaySaida.x}
            cy={todaySaida.y}
            r="5"
            className="fill-white stroke-rose-500 stroke-2"
          />
          <circle cx={todaySaida.x} cy={todaySaida.y} r="2" className="fill-rose-500" />
          <g
            transform={`translate(${Math.min(todaySaida.x - 26, SVG_WIDTH - 52)}, ${todaySaida.y + 8})`}
          >
            <rect width="52" height="16" rx="8" fill="#be123c" />
            <text x="26" y="12" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="bold">
              {formatCurrency(data[todayIndex].saida)}
            </text>
          </g>
        </svg>

        {/* Legend */}
        <div className="mt-1 flex items-center justify-center gap-4 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-indigo-600">
            <span className="inline-block h-2 w-4 rounded-full bg-brand-blue" />
            Entradas
          </span>
          <span className="flex items-center gap-1 text-rose-500">
            <span className="inline-block h-2 w-4 rounded-full bg-brand-coral" />
            Saídas
          </span>
        </div>

        {/* Day labels */}
        <div className="mt-2 flex justify-between px-1 text-[11px] font-bold text-slate-400">
          {data.map((day, i) => (
            <span
              key={day.diaAbreviado}
              className={i === todayIndex ? "font-extrabold text-indigo-600" : ""}
            >
              {i === todayIndex ? "Hoje" : day.diaAbreviado}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
