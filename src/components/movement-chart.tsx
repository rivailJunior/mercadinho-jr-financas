"use client";

import { formatCurrency } from "@/lib/formatCurrency";
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

export interface MovementChartDay {
  /** Full label for the selected day, e.g. "Terça" or "15 de out.". */
  dia: string;
  /** Short axis label, e.g. "Ter" or "15". */
  diaAbreviado: string;
  valor: number;
  saida: number;
}

interface MovementChartProps {
  data: MovementChartDay[];
  title: string;
  /** Subtitle shown while the latest day is selected, e.g. "Movimento dos últimos 30 dias". */
  subtitle: string;
  /** Unique id for the title element referenced by aria-labelledby. */
  titleId: string;
  chartAriaLabel: string;
  /** Prefix for the svg gradient ids — must be unique per chart on the page. */
  gradientPrefix: string;
  /** Render an axis button every Nth day (default 1). Other days keep an empty slot. */
  axisLabelEvery?: number;
  /** Axis text for the latest point (default "Hoje"). */
  currentLabel?: string;
  /** Accessible name for the latest point's button (default "de hoje"). */
  currentAriaLabel?: string;
  /** Reference value drawn as a flat gray line — the minimum expected per period. */
  minimumExpected?: number;
}

export const MovementChart = ({
  data,
  title,
  subtitle,
  titleId,
  chartAriaLabel,
  gradientPrefix,
  axisLabelEvery = 1,
  currentLabel = "Hoje",
  currentAriaLabel = "de hoje",
  minimumExpected,
}: MovementChartProps) => {
  const [selectedIndex, setSelectedIndex] = useState(data.length - 1);

  if (data.length < 2) return null;

  const todayIndex = data.length - 1;
  const activeIndex = Math.min(Math.max(selectedIndex, 0), todayIndex);
  const step = SVG_WIDTH / (data.length - 1);
  const maxValue = Math.max(
    ...data.map((d) => d.valor),
    ...data.map((d) => d.saida),
    minimumExpected ?? 0,
    1,
  );
  const minimumY =
    minimumExpected == null
      ? null
      : PADDING_TOP + CHART_HEIGHT - (minimumExpected / maxValue) * CHART_HEIGHT;

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

  const entradaGradId = `${gradientPrefix}EntradaGrad`;
  const saidaGradId = `${gradientPrefix}SaidaGrad`;

  return (
    <section
      className="rounded-3xl border border-slate-100 bg-white p-5 shadow-soft"
      aria-labelledby={titleId}
    >
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 id={titleId} className="text-xs font-bold uppercase tracking-wide text-slate-700">
            {title}
          </h4>
          <p className="text-xs text-slate-400">
            {isTodaySelected ? subtitle : `Movimento de ${selectedDay.dia}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="tabular-nums text-[11px] font-black text-indigo-600">
            Entrada: {formatCurrency(selectedDay.valor)}
          </span>
          <span className="tabular-nums text-[11px] font-black text-rose-500">
            Saída: {formatCurrency(selectedDay.saida)}
          </span>
          {minimumExpected != null && (
            <span className="tabular-nums text-[11px] font-black text-slate-400">
              Objetivo: {formatCurrency(minimumExpected)}
            </span>
          )}
        </div>
      </div>

      <div className="relative pb-1 pt-2">
        <svg
          className="h-28 w-full overflow-visible"
          fill="none"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          aria-label={chartAriaLabel}
          role="img"
        >
          <defs>
            <linearGradient id={entradaGradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5b72ff" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#5b72ff" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id={saidaGradId} x1="0" y1="0" x2="0" y2="1">
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
          <path d={entradaArea} fill={`url(#${entradaGradId})`} />
          <path d={entradaLine} stroke="#5b72ff" strokeLinecap="round" strokeWidth="3" />

          {/* Saída (red) */}
          <path d={saidaArea} fill={`url(#${saidaGradId})`} />
          <path
            d={saidaLine}
            stroke="#ff6584"
            strokeLinecap="round"
            strokeWidth="3"
            strokeDasharray="6 3"
          />

          {/* Minimum expected (gray reference) */}
          {minimumY != null && (
            <line
              x1={0}
              y1={minimumY}
              x2={SVG_WIDTH}
              y2={minimumY}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              strokeWidth="1.5"
            />
          )}

          {/* Selected day dot — Entrada */}
          <circle
            cx={selEntrada.x}
            cy={selEntrada.y}
            r="6"
            className="fill-white stroke-indigo-600 stroke-3"
          />
          <circle cx={selEntrada.x} cy={selEntrada.y} r="2.5" className="fill-indigo-600" />
          {/* <g transform={`translate(${clampPillX(selEntrada.x, PILL_WIDTH, SVG_WIDTH)}, ${selEntrada.y - 22})`}>
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
          </g> */}

          {/* Selected day dot — Saída */}
          <circle
            cx={selSaida.x}
            cy={selSaida.y}
            r="5"
            className="fill-white stroke-rose-500 stroke-2"
          />
          <circle cx={selSaida.x} cy={selSaida.y} r="2" className="fill-rose-500" />
          {/* <g transform={`translate(${clampPillX(selSaida.x, PILL_WIDTH, SVG_WIDTH)}, ${saidaPillY})`}>
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
          </g> */}

          {/* Tap targets — one invisible column per day */}
          {data.map((day, i) => {
            const left = Math.max(0, (i - 0.5) * step);
            const right = Math.min(SVG_WIDTH, (i + 0.5) * step);
            return (
              // biome-ignore lint/a11y/useKeyWithClickEvents: keyboard access is provided by the day buttons below the chart
              <rect
                key={`hit-${day.dia}`}
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
        {/* <div className="mt-1 flex items-center justify-center gap-4 text-[10px] font-bold">
          <span className="flex items-center gap-1 text-indigo-600">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-blue" />
            Entradas
          </span>
          <span className="flex items-center gap-1 text-rose-500">
            <span className="inline-block h-2 w-2 rounded-full bg-brand-coral" />
            Saídas
          </span>
        </div> */}

        {/* Day labels */}
        <div className="mt-2 flex justify-between px-1 text-[11px] font-bold text-slate-400">
          {data.map((day, i) => {
            const showLabel = i % axisLabelEvery === 0 || i === todayIndex;
            if (!showLabel) return <span key={day.dia} className="flex-1" aria-hidden="true" />;
            return (
              <button
                key={day.dia}
                type="button"
                onClick={() => setSelectedIndex(i)}
                aria-pressed={i === activeIndex}
                aria-label={`Ver movimento ${i === todayIndex ? currentAriaLabel : `de ${day.dia}`}`}
                className={`flex-1 cursor-pointer transition-colors ${i === activeIndex ? "font-extrabold text-indigo-600" : "hover:text-slate-600"
                  }`}
              >
                {i === todayIndex ? currentLabel : day.diaAbreviado}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
