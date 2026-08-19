import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LifecycleStepper, Modal } from "./ui";

describe("enterprise UI primitives", () => {
  it("marks completed, current, and upcoming lifecycle stages", () => {
    render(<LifecycleStepper steps={[
      { label: "Draft", state: "complete" },
      { label: "Approval", state: "current" },
      { label: "Ordered", state: "upcoming" },
    ]} />);

    expect(screen.getByText("Approval").closest("li")).toHaveAttribute("aria-current", "step");
    expect(screen.getByText("Draft").closest("li")).toHaveClass("complete");
    expect(screen.getByText("Ordered").closest("li")).toHaveClass("upcoming");
  });

  it("renders an accessible modal and delegates explicit cancellation", async () => {
    const close = vi.fn();
    render(<Modal open title="Create supplier" description="Add supplier details" onClose={close}>
      <button>Save supplier</button>
    </Modal>);

    expect(screen.getByRole("dialog", { name: "Create supplier" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(close).toHaveBeenCalledOnce();
  });
});
