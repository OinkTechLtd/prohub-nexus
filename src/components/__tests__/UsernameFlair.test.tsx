import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import UsernameFlair from "@/components/UsernameFlair";

describe("UsernameFlair sticker", () => {
  it("renders emoji sticker chip", () => {
    const { container } = render(<UsernameFlair sticker="🔥" />);
    const chip = container.querySelector(".username-sticker");
    expect(chip).not.toBeNull();
    expect(chip!.textContent).toContain("🔥");
  });

  it("renders image sticker when URL is provided", () => {
    const { container } = render(<UsernameFlair sticker="https://example.com/a.png" />);
    const img = container.querySelector(".username-sticker img");
    expect(img).not.toBeNull();
    expect((img as HTMLImageElement).getAttribute("src")).toBe("https://example.com/a.png");
  });

  it("renders nothing when no decorations are set", () => {
    const { container } = render(<UsernameFlair />);
    expect(container.querySelector(".username-sticker")).toBeNull();
  });
});
