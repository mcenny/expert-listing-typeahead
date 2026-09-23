import { renderHook } from "@testing-library/react";
import { act } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

describe("useDebouncedValue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("updates only after the configured delay", () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, 300),
      { initialProps: { value: "n" } },
    );

    expect(result.current).toBe("n");

    rerender({ value: "ni" });

    expect(result.current).toBe("n");

    act(() => {
      jest.advanceTimersByTime(299);
    });

    expect(result.current).toBe("n");

    act(() => {
      jest.advanceTimersByTime(1);
    });

    expect(result.current).toBe("ni");
  });
});
