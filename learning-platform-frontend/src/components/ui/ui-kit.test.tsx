// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import Modal from "./Modal";
import MonthPicker from "./MonthPicker";
import TaskCheckbox from "./TaskCheckbox";

afterEach(cleanup);

describe("Modal", () => {
  it("renders nothing while closed", () => {
    render(
      <Modal open={false} onClose={() => {}} title="Hello">
        body
      </Modal>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("is a labelled modal dialog with its title, description and content", () => {
    render(
      <Modal open onClose={() => {}} title="Set up" description="Tell us more">
        <p>content</p>
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Set up" });
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Tell us more")).toBeTruthy();
    expect(screen.getByText("content")).toBeTruthy();
  });

  it("closes on Escape, the X button and the backdrop when dismissible", () => {
    const onClose = vi.fn();
    const { container } = render(
      <Modal open onClose={onClose} title="T">
        x
      </Modal>,
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalledTimes(2);
    const backdrop = document.body.querySelector('[aria-hidden="true"].absolute');
    expect(backdrop).toBeTruthy();
    fireEvent.click(backdrop as Element);
    expect(onClose).toHaveBeenCalledTimes(3);
    void container;
  });

  it("cannot be dismissed when dismissible is false", () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="T" dismissible={false}>
        x
      </Modal>,
    );
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Close dialog" })).toBeNull();
    const backdrop = document.body.querySelector('[aria-hidden="true"].absolute');
    fireEvent.click(backdrop as Element);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("moves focus inside on open and puts it back on close", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>opener</button>
          <Modal open={open} onClose={() => setOpen(false)} title="T">
            <button data-autofocus>inside</button>
          </Modal>
        </>
      );
    }
    render(<Harness />);
    const opener = screen.getByRole("button", { name: "opener" });
    opener.focus();
    fireEvent.click(opener);
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "inside" }));
    fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
    // Focus returns immediately; the panel then plays its exit before unmounting.
    expect(document.activeElement).toBe(opener);
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });

  it("keeps Tab inside the dialog by wrapping from last to first and back", () => {
    render(
      <Modal open onClose={() => {}} title="T" footer={<button>last</button>}>
        <button>middle</button>
      </Modal>,
    );
    const close = screen.getByRole("button", { name: "Close dialog" });
    const last = screen.getByRole("button", { name: "last" });
    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });
    expect(document.activeElement).toBe(close);
    close.focus();
    fireEvent.keyDown(close, { key: "Tab", shiftKey: true });
    expect(document.activeElement).toBe(last);
  });
});

describe("MonthPicker", () => {
  it("shows the year's twelve months and marks the selected one", () => {
    render(
      <MonthPicker value="2026-12" onChange={() => {}} min="2026-10" max="2028-10" />,
    );
    expect(screen.getAllByRole("button", { pressed: false }).length).toBeGreaterThan(5);
    expect(
      screen.getByRole("button", { name: "December 2026" }).getAttribute("aria-pressed"),
    ).toBe("true");
    expect(screen.getByText("2026")).toBeTruthy();
  });

  it("disables months outside the allowed range, in the visible year", () => {
    render(<MonthPicker value={null} onChange={() => {}} min="2026-10" max="2028-10" />);
    expect((screen.getByRole("button", { name: "September 2026" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "October 2026" }) as HTMLButtonElement).disabled).toBe(false);
    expect((screen.getByRole("button", { name: "December 2026" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("reports the picked month", () => {
    const onChange = vi.fn();
    render(<MonthPicker value={null} onChange={onChange} min="2026-10" max="2028-10" />);
    fireEvent.click(screen.getByRole("button", { name: "November 2026" }));
    expect(onChange).toHaveBeenCalledWith("2026-11");
  });

  it("moves between years but stops at the range's first and last year", () => {
    render(<MonthPicker value={null} onChange={() => {}} min="2026-10" max="2028-10" />);
    const prev = screen.getByRole("button", { name: "Previous year" }) as HTMLButtonElement;
    const next = screen.getByRole("button", { name: "Next year" }) as HTMLButtonElement;
    expect(prev.disabled).toBe(true);
    fireEvent.click(next);
    expect(screen.getByText("2027")).toBeTruthy();
    expect((screen.getByRole("button", { name: "January 2027" }) as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(next);
    expect(screen.getByText("2028")).toBeTruthy();
    expect(next.disabled).toBe(true);
    expect((screen.getByRole("button", { name: "November 2028" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "October 2028" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("opens on the year of the current value", () => {
    render(<MonthPicker value="2027-05" onChange={() => {}} min="2026-10" max="2028-10" />);
    expect(screen.getByText("2027")).toBeTruthy();
  });
});

describe("TaskCheckbox", () => {
  it("is a checkbox named by its label and reflects its state", () => {
    render(
      <TaskCheckbox checked label="Physics: Kinematics" onChange={() => {}}>
        45 min
      </TaskCheckbox>,
    );
    const box = screen.getByRole("checkbox", { name: "Physics: Kinematics" });
    expect(box.getAttribute("aria-checked")).toBe("true");
    expect(screen.getByText("45 min")).toBeTruthy();
  });

  it("asks for the opposite value when pressed", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TaskCheckbox checked={false} label="Task" onChange={onChange} />,
    );
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenLastCalledWith(true);
    rerender(<TaskCheckbox checked label="Task" onChange={onChange} />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).toHaveBeenLastCalledWith(false);
  });

  it("ignores presses while a save is pending or when disabled", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <TaskCheckbox checked={false} label="Task" onChange={onChange} pending />,
    );
    const box = screen.getByRole("checkbox") as HTMLButtonElement;
    expect(box.getAttribute("aria-busy")).toBe("true");
    fireEvent.click(box);
    rerender(<TaskCheckbox checked={false} label="Task" onChange={onChange} disabled />);
    fireEvent.click(screen.getByRole("checkbox"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
