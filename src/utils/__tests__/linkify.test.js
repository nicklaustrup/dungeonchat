import React from "react";
import { render, screen } from "@testing-library/react";
import { processMessageText } from "../linkify";

// Test the processMessageText function
describe("processMessageText", () => {
  test("should convert URLs to clickable links", () => {
    const text = "Check out https://example.com for more info!";
    const result = processMessageText(text);

    // Since the result contains JSX elements, we need to render it to test
    render(<div>{result}</div>);

    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveClass("message-link");
    expect(link).toHaveTextContent("https://example.com");
  });

  test("should convert www URLs to clickable links", () => {
    const text = "Visit www.example.com for details";
    const result = processMessageText(text);

    render(<div>{result}</div>);

    const link = screen.getByRole("link");
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://www.example.com");
    expect(link).toHaveTextContent("www.example.com");
  });

  test("should handle multiple URLs in one message", () => {
    const text = "Check https://example.com and https://test.org out!";
    const result = processMessageText(text);

    render(<div>{result}</div>);

    const links = screen.getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "https://example.com");
    expect(links[1]).toHaveAttribute("href", "https://test.org");
  });

  test("should preserve search term highlighting alongside links", () => {
    const text = "Check out https://example.com for example content";
    const result = processMessageText(text, "example");

    render(<div data-testid="message-content">{result}</div>);

    const link = screen.getByRole("link");
    const highlight = screen.getByText("example");

    expect(link).toBeInTheDocument();
    expect(highlight).toBeInTheDocument();
    expect(highlight.tagName.toLowerCase()).toBe("mark");
    expect(highlight).toHaveClass("search-highlight");
  });

  test("should return original text when no URLs or search terms", () => {
    const text = "This is just plain text";
    const result = processMessageText(text);

    expect(result).toBe(text);
  });

  test("should handle text with only search highlighting", () => {
    const text = "This is some example text";
    const result = processMessageText(text, "example");

    render(<div>{result}</div>);

    const highlight = screen.getByText("example");
    expect(highlight).toBeInTheDocument();
    expect(highlight.tagName.toLowerCase()).toBe("mark");
    expect(highlight).toHaveTextContent("example");
  });
});
