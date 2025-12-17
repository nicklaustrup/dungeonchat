import { renderHook, act } from "@testing-library/react";
import { useCanvasTools } from "./useCanvasTools";

describe("useCanvasTools", () => {
  it("should initialize with default values", () => {
    const { result } = renderHook(() => useCanvasTools());

    expect(result.current.activeTool).toBe("pointer"); // Changed default from 'ping' to 'pointer'
    expect(result.current.pingColor).toBe("#ffff00");
    expect(result.current.penColor).toBe("#ffffff");
    expect(result.current.shapeColor).toBe("#ff0000");
    expect(result.current.shapeOpacity).toBe(0.5);
    expect(result.current.shapePersistent).toBe(false);
    expect(result.current.shapeVisibility).toBe("all");
  });

  it("should set active tool", () => {
    const { result } = renderHook(() => useCanvasTools());

    act(() => {
      result.current.setActiveTool("pen");
    });

    expect(result.current.activeTool).toBe("pen");
  });

  it("should update ping color", () => {
    const { result } = renderHook(() => useCanvasTools());

    act(() => {
      result.current.updateToolSettings("ping", { color: "#ff0000" });
    });

    expect(result.current.pingColor).toBe("#ff0000");
  });

  it("should update shape settings", () => {
    const { result } = renderHook(() => useCanvasTools());

    act(() => {
      result.current.updateToolSettings("circle", {
        color: "#00ff00",
        opacity: 0.8,
        persistent: true,
        visibility: "dm",
      });
    });

    expect(result.current.shapeColor).toBe("#00ff00");
    expect(result.current.shapeOpacity).toBe(0.8);
    expect(result.current.shapePersistent).toBe(true);
    expect(result.current.shapeVisibility).toBe("dm");
  });

  it("should get active tool config", () => {
    const { result } = renderHook(() => useCanvasTools());

    act(() => {
      result.current.setActiveTool("circle");
    });

    const config = result.current.getActiveToolConfig();

    expect(config.tool).toBe("circle");
    expect(config.color).toBe("#ff0000");
    expect(config.opacity).toBe(0.5);
    expect(config.persistent).toBe(false);
    expect(config.visibility).toBe("all");
  });

  it("should identify shape tools", () => {
    const { result } = renderHook(() => useCanvasTools());

    expect(result.current.isShapeTool("circle")).toBe(true);
    expect(result.current.isShapeTool("rectangle")).toBe(true);
    expect(result.current.isShapeTool("cone")).toBe(true);
    expect(result.current.isShapeTool("line")).toBe(true);
    expect(result.current.isShapeTool("ping")).toBe(false);
    expect(result.current.isShapeTool("pen")).toBe(false);
  });
});
