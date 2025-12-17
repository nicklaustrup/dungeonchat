import React from "react";
import { render, screen } from "@testing-library/react";
import { highlightText } from "../utils/highlightText";

describe("highlightText utility", () => {
  test("returns raw string when no term provided", () => {
    const raw = "Hello World";
    const result = highlightText(raw, "");
    expect(result).toBe(raw);
  });

  test("highlights single occurrence case-insensitive", () => {
    const raw = "Hello World";
    const nodes = highlightText(raw, "world");
    render(<div>{nodes}</div>);
    const mark = screen.getByText(/World/i).closest("mark");
    expect(mark).toBeInTheDocument();
  });

  test("escapes regex special characters", () => {
    const raw = "Price is $5.00? Yes $5.00!";
    const nodes = highlightText(raw, "$5.00?");
    render(<div>{nodes}</div>);
    const marks = screen.getAllByText("$5.00?");
    expect(marks.length).toBe(1);
  });

  test("multiple occurrences highlighted", () => {
    const raw = "test TEST TeSting";
    const nodes = highlightText(raw, "test");
    render(<div>{nodes}</div>);
    const markElements = screen
      .getAllByText(/test/i)
      .filter((el) => el.tagName.toLowerCase() === "mark");
    expect(markElements.length).toBeGreaterThanOrEqual(2);
  });
});
