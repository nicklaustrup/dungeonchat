import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ReactionList from "../components/ChatRoom/parts/ReactionList";

describe("ReactionList", () => {
  test("renders reactions and toggles", () => {
    const reactions = { "👍": ["u1", "u2"], "❤️": ["u3"] };
    const onToggle = jest.fn();
    render(
      <ReactionList
        reactions={reactions}
        currentUserId="u1"
        onToggle={onToggle}
      />
    );
    const items = screen.getAllByTestId("reaction-item");
    expect(items.length).toBe(2);
    fireEvent.click(items[0]);
    expect(onToggle).toHaveBeenCalledWith("👍");
  });
});
