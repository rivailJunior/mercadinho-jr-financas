import { YearlyChart } from "@/components";
import type { YearlyMonth } from "@/types/cashClosing";
import { fireEvent, render, screen } from "@testing-library/react";

const year: YearlyMonth[] = [
  { dia: "Janeiro", diaAbreviado: "Jan", valor: 1000, saida: 100 },
  { dia: "Fevereiro", diaAbreviado: "Fev", valor: 2000, saida: 200 },
  { dia: "Março", diaAbreviado: "Mar", valor: 1500, saida: 50 },
  { dia: "Abril", diaAbreviado: "Abr", valor: 3000, saida: 300 },
  { dia: "Maio", diaAbreviado: "Mai", valor: 2500, saida: 400 },
  { dia: "Junho", diaAbreviado: "Jun", valor: 1800, saida: 150 },
  { dia: "Julho", diaAbreviado: "Jul", valor: 2200, saida: 250 },
  { dia: "Agosto", diaAbreviado: "Ago", valor: 1700, saida: 120 },
  { dia: "Setembro", diaAbreviado: "Set", valor: 2800, saida: 350 },
  { dia: "Outubro", diaAbreviado: "Out", valor: 0, saida: 0 },
];

describe("YearlyChart", () => {
  test("shows the current month's amounts by default", () => {
    render(<YearlyChart data={year} />);

    expect(screen.getByText("Como foi seu ano")).toBeDefined();
    // Current month is zeroed → header shows its values
    expect(screen.getByText("Entrada: R$ 0")).toBeDefined();
    expect(screen.getByText("Saída: R$ 0")).toBeDefined();
    expect(screen.getByRole("button", { name: /mês atual/i })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  test("shows the selected month's amounts when a month label is pressed", () => {
    render(<YearlyChart data={year} />);

    fireEvent.click(screen.getByRole("button", { name: /maio/i }));

    expect(screen.getByText("Movimento de Maio")).toBeDefined();
    // Header reflects the selected month's values
    expect(screen.getByText("Entrada: R$ 2.500")).toBeDefined();
    expect(screen.getByText("Saída: R$ 400")).toBeDefined();
    expect(screen.getByRole("button", { name: /maio/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /mês atual/i })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("shows the selected month's amounts when the chart area is pressed", () => {
    const { container } = render(<YearlyChart data={year} />);

    const hitAreas = container.querySelectorAll('rect[fill="transparent"]');
    expect(hitAreas).toHaveLength(10);

    fireEvent.click(hitAreas[2]); // Março

    expect(screen.getByText("Movimento de Março")).toBeDefined();
    expect(screen.getByText("Entrada: R$ 1.500")).toBeDefined();
    expect(screen.getByText("Saída: R$ 50")).toBeDefined();
  });

  test("returns to the current month when 'Atual' is pressed", () => {
    render(<YearlyChart data={year} />);

    fireEvent.click(screen.getByRole("button", { name: /abril/i }));
    fireEvent.click(screen.getByRole("button", { name: /mês atual/i }));

    expect(screen.getByText("Entrada: R$ 0")).toBeDefined();
    expect(screen.getByText("Saída: R$ 0")).toBeDefined();
  });

  test("renders nothing with fewer than two months", () => {
    const { container } = render(<YearlyChart data={[year[0]]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
