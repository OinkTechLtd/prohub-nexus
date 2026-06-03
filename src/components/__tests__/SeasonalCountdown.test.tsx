import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SeasonalCountdown from "@/components/SeasonalCountdown";

describe("SeasonalCountdown", () => {
  it("renders countdown labels and 4 cells", () => {
    render(<SeasonalCountdown />);
    expect(screen.getByText(/осталось/i)).toBeInTheDocument();
    expect(screen.getByText("Дней")).toBeInTheDocument();
    expect(screen.getByText("Часов")).toBeInTheDocument();
    expect(screen.getByText("Мин")).toBeInTheDocument();
    expect(screen.getByText("Сек")).toBeInTheDocument();
  });

  it("contains seasonal kind class", () => {
    const { container } = render(<SeasonalCountdown />);
    const root = container.querySelector(".seasonal-countdown");
    expect(root).not.toBeNull();
    expect(
      root!.className.includes("seasonal-countdown--summer") ||
        root!.className.includes("seasonal-countdown--winter")
    ).toBe(true);
  });
});
