import { MovementChart } from "@/components/movement-chart";
import type { WeeklyDay } from "@/types/cashClosing";

interface WeeklyChartProps {
  data: WeeklyDay[];
}

export const WeeklyChart = ({ data }: WeeklyChartProps) => (
  <MovementChart
    data={data}
    title="Como foi sua semana"
    subtitle="Movimento dos últimos 7 dias"
    titleId="weekly-chart-title"
    chartAriaLabel="Gráfico de curvas do movimento semanal"
    gradientPrefix="weekly"
  />
);
