import { MovementChart } from "@/components/movement-chart";
import { todayISODate } from "@/lib/dates";
import type { YearlyMonth } from "@/types/cashClosing";

interface YearlyChartProps {
  data: YearlyMonth[];
}

export const YearlyChart = ({ data }: YearlyChartProps) => (
  <MovementChart
    data={data}
    title="Como foi seu ano"
    subtitle={`Movimento de ${todayISODate().slice(0, 4)}`}
    titleId="yearly-chart-title"
    chartAriaLabel="Gráfico de curvas do movimento anual"
    gradientPrefix="yearly"
    currentLabel="Atual"
    currentAriaLabel="do mês atual"
  />
);
