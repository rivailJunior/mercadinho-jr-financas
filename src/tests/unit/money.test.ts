import {
  allocateEvenly,
  assertCents,
  centsToReais,
  clampNonNegative,
  formatCents,
  parseCentsInput,
  reaisToCents,
  sumCents,
} from "@/lib/money";

describe("money (integer cents)", () => {
  test("reaisToCents rounds to the nearest cent and absorbs float error", () => {
    expect(reaisToCents(12.21)).toBe(1221);
    expect(reaisToCents(0.1 + 0.2)).toBe(30);
    expect(reaisToCents(21600)).toBe(2160000);
    expect(reaisToCents(-10)).toBe(-1000);
  });

  test("centsToReais is the inverse for whole cents", () => {
    expect(centsToReais(1221)).toBeCloseTo(12.21, 10);
    expect(centsToReais(2160000)).toBe(21600);
  });

  test("assertCents rejects non-integer values", () => {
    expect(() => assertCents(12.5)).toThrow();
    expect(assertCents(1221)).toBe(1221);
  });

  test("sumCents is exact where float addition would drift", () => {
    // 0.1 + 0.2 + 0.3 in reais drifts; in cents it is exact.
    expect(sumCents(10, 20, 30)).toBe(60);
    expect(sumCents(1221, 1000000)).toBe(1001221);
  });

  test("parseCentsInput handles pt-BR formatting and signs", () => {
    expect(parseCentsInput("R$ 12,21")).toBe(1221);
    expect(parseCentsInput("1.234,56")).toBe(123456);
    expect(parseCentsInput("-R$ 10,00")).toBe(-1000);
    expect(parseCentsInput("")).toBe(0);
    expect(parseCentsInput("-")).toBe(0);
  });

  test("formatCents renders BRL", () => {
    expect(formatCents(1221)).toMatch(/12,21/);
    expect(formatCents(2160000)).toMatch(/21\.600,00/);
  });

  test("clampNonNegative floors at zero", () => {
    expect(clampNonNegative(-5)).toBe(0);
    expect(clampNonNegative(500)).toBe(500);
  });

  test("allocateEvenly never loses or creates cents", () => {
    expect(allocateEvenly(100, 3)).toEqual([34, 33, 33]);
    expect(allocateEvenly(100, 3).reduce((a, b) => a + b, 0)).toBe(100);
    expect(allocateEvenly(1000, 4)).toEqual([250, 250, 250, 250]);
    expect(allocateEvenly(-100, 3).reduce((a, b) => a + b, 0)).toBe(-100);
  });
});
