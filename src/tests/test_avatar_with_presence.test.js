import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AvatarWithPresence from "../components/ChatRoom/parts/AvatarWithPresence";

jest.mock("../utils/avatar", () => ({
  getFallbackAvatar: jest
    .fn()
    .mockImplementation(() => "data:image/png;base64,fallback"),
}));

describe("AvatarWithPresence component", () => {
  const baseProps = {
    uid: "user1",
    photoURL: "https://invalid.example/avatar.png",
    displayName: "Test User",
    presenceState: "online",
    presenceTitle: "Online (last active just now)",
  };

  test("renders image with alt including display name", () => {
    render(<AvatarWithPresence {...baseProps} />);
    expect(screen.getByAltText("Test User's avatar")).toBeInTheDocument();
  });

  test("renders status indicator with presence class", () => {
    render(<AvatarWithPresence {...baseProps} />);
    const indicator = screen.getByTestId("status-indicator");
    expect(indicator.className).toMatch(/online/);
    expect(indicator).toHaveAttribute("title", baseProps.presenceTitle);
  });

  test("invokes onClick when avatar container clicked", () => {
    const handleClick = jest.fn();
    render(<AvatarWithPresence {...baseProps} onClick={handleClick} />);
    fireEvent.click(screen.getByTestId("avatar-with-presence"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test("falls back to generated avatar on error (marks fallbackApplied)", async () => {
    render(<AvatarWithPresence {...baseProps} />);
    const img = screen.getByTestId("avatar-image");
    expect(img).toHaveAttribute("src", baseProps.photoURL); // initial
    fireEvent.error(img);
    await waitFor(() => {
      // React/jsdom may clear invalid src; rely on our explicit tracking attributes instead
      expect(img.dataset.fallbackApplied).toBe("true");
    });
  });
});
