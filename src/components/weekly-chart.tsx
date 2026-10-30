"use client";

import { formatCurrency } from "@/lib/formatCurrency";
import type { WeeklyDay } from "@/types/cashClosing";
import { useState } from "react";

const SVG_WIDTH = 340;
const SVG_HEIGHT = 100;
const PADDING_TOP = 15;
const PADDING_BOTTOM = 10;
const CHART_HEIGHT = SVG_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
const PILL_WIDTH = 52;
const PILL_HEIGHT = 16;

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

const clampPillX = (x: number) => Math.min(Math.max(x - PILL_WIDTH / 2, 0), SVG_WIDTH - PILL_WIDTH);

interface WeeklyChartProps {
  data: WeeklyDay[];
}

export const WeeklyChart = ({ data }: WeeklyChartProps) => {
  const [selectedIndex, setSelectedIndex] = useState(data.length - 1);

  if (data.length < 2) return null;

  const todayIndex = data.length - 1;
  const activeIndex = Math.min(Math.max(selectedIndex, 0), todayIndex);
  const step = SVG_WIDTH / (data.length - 1);
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

  const selectedDay = data[activeIndex];
  const selEntrada = entradaPoints[activeIndex];
  const selSaida = saidaPoints[activeIndex];
  const isTodaySelected = activeIndex === todayIndex;

  // When the saída dot sits right above the entrada dot, the default "below the
  // dot" pill would cover the entrada pill — flip it above instead.
  const saidaPillY = selEntrada.y - selSaida.y > 14 ? selSaida.y - PILL_HEIGHT - 6 : selSaida.y + 8;

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
          <p className="text-xs text-slate-400">
            {isTodaySelected ? "Movimento dos últimos 7 dias" : `Movimento de ${selectedDay.dia}`}
          </p>
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

          {/* Selected day guide */}
          <line
            x1={selEntrada.x}
            y1={0}
            x2={selEntrada.x}
            y2={SVG_HEIGHT}
            stroke="#e2e8f0"
            strokeDasharray="3 3"
            strokeWidth="1.5"
          />

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

          {/* Selected day dot — Entrada */}
          <circle
            cx={selEntrada.x}
            cy={selEntrada.y}
            r="6"
            className="fill-white stroke-indigo-600 stroke-3"
          />
          <circle cx={selEntrada.x} cy={selEntrada.y} r="2.5" className="fill-indigo-600" />
          <g transform={`translate(${clampPillX(selEntrada.x)}, ${selEntrada.y - 22})`}>
            <rect width={PILL_WIDTH} height={PILL_HEIGHT} rx="8" fill="#1e293b" />
            <text
              x={PILL_WIDTH / 2}
              y="12"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9"
              fontWeight="bold"
            >
              {formatCurrency(selectedDay.valor)}
            </text>
          </g>

          {/* Selected day dot — Saída */}
          <circle
            cx={selSaida.x}
            cy={selSaida.y}
            r="5"
            className="fill-white stroke-rose-500 stroke-2"
          />
          <circle cx={selSaida.x} cy={selSaida.y} r="2" className="fill-rose-500" />
          <g transform={`translate(${clampPillX(selSaida.x)}, ${saidaPillY})`}>
            <rect width={PILL_WIDTH} height={PILL_HEIGHT} rx="8" fill="#be123c" />
            <text
              x={PILL_WIDTH / 2}
              y="12"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9"
              fontWeight="bold"
            >
              {formatCurrency(selectedDay.saida)}
            </text>
          </g>

          {/* Tap targets — one invisible column per day */}
          {data.map((day, i) => {
            const left = Math.max(0, (i - 0.5) * step);
            const right = Math.min(SVG_WIDTH, (i + 0.5) * step);
            return (
              // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard access is provided by the day buttons below the chart
              <rect
                key={`hit-${day.diaAbreviado}`}
                x={left}
                y={0}
                width={right - left}
                height={SVG_HEIGHT}
                fill="transparent"
                className="cursor-pointer"
                onClick={() => setSelectedIndex(i)}
              />
            );
          })}
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
            <button
              key={day.diaAbreviado}
              type="button"
              onClick={() => setSelectedIndex(i)}
              aria-pressed={i === activeIndex}
              aria-label={`Ver movimento de ${i === todayIndex ? "hoje" : day.dia}`}
              className={`cursor-pointer transition-colors ${
                i === activeIndex ? "font-extrabold text-indigo-600" : "hover:text-slate-600"
              }`}
            >
              {i === todayIndex ? "Hoje" : day.diaAbreviado}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
