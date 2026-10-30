import { WeeklyChart } from "@/components";
import type { WeeklyDay } from "@/types/cashClosing";
import { fireEvent, render, screen } from "@testing-library/react";

const week: WeeklyDay[] = [
  { dia: "Sexta", diaAbreviado: "Sex", valor: 100, saida: 10 },
  { dia: "Sábado", diaAbreviado: "Sáb", valor: 200, saida: 20 },
  { dia: "Domingo", diaAbreviado: "Dom", valor: 150, saida: 5 },
  { dia: "Segunda", diaAbreviado: "Seg", valor: 300, saida: 30 },
  { dia: "Terça", diaAbreviado: "Ter", valor: 250, saida: 40 },
  { dia: "Quarta", diaAbreviado: "Qua", valor: 180, saida: 15 },
  { dia: "Quinta", diaAbreviado: "Qui", valor: 0, saida: 0 },
];

describe("WeeklyChart", () => {
  test("shows today's amounts by default", () => {
    render(<WeeklyChart data={week} />);

    expect(screen.getByText("Movimento dos últimos 7 dias")).toBeDefined();
    // Today is zeroed → both pills render "R$ 0"
    expect(screen.getAllByText("R$ 0")).toHaveLength(2);
    expect(screen.getByRole("button", { name: /hoje/i })).toHaveAttribute("aria-pressed", "true");
  });

  test("shows the selected day's amounts when a day label is pressed", () => {
    render(<WeeklyChart data={week} />);

    fireEvent.click(screen.getByRole("button", { name: /terça/i }));

    expect(screen.getByText("Movimento de Terça")).toBeDefined();
    expect(screen.getByText("R$ 250")).toBeDefined();
    expect(screen.getByText("R$ 40")).toBeDefined();
    expect(screen.getByRole("button", { name: /terça/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /hoje/i })).toHaveAttribute("aria-pressed", "false");
  });

  test("shows the selected day's amounts when the chart area is pressed", () => {
    const { container } = render(<WeeklyChart data={week} />);

    const hitAreas = container.querySelectorAll('rect[fill="transparent"]');
    expect(hitAreas).toHaveLength(7);

    fireEvent.click(hitAreas[2]); // Domingo

    expect(screen.getByText("Movimento de Domingo")).toBeDefined();
    expect(screen.getByText("R$ 150")).toBeDefined();
    expect(screen.getByText("R$ 5")).toBeDefined();
  });

  test("returns to today when 'Hoje' is pressed", () => {
    render(<WeeklyChart data={week} />);

    fireEvent.click(screen.getByRole("button", { name: /segunda/i }));
    fireEvent.click(screen.getByRole("button", { name: /hoje/i }));

    expect(screen.getByText("Movimento dos últimos 7 dias")).toBeDefined();
    expect(screen.getAllByText("R$ 0")).toHaveLength(2);
  });

  test("renders nothing with fewer than two days", () => {
    const { container } = render(<WeeklyChart data={[week[0]]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
