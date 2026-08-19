import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ActorProvider } from "@/components/actor-context";
import NewRequestPage from "./page";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn() }),
}));

describe("NewRequestPage", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("submits the selected department identifier rather than its display code", async () => {
    const departmentId = "33333333-3333-3333-3333-333333333333";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify([
        { id: departmentId, code: "OPS", name: "Operations", active: true },
      ]), { headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "7d46f23f-0a21-4f18-b487-d4eb79708e85",
      }), { status: 201, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    render(<ActorProvider><NewRequestPage /></ActorProvider>);
    const user = userEvent.setup();

    await user.selectOptions(await screen.findByLabelText("Department"), departmentId);
    fireEvent.change(screen.getByLabelText("Request title"), { target: { value: "Replacement laptops" } });
    fireEvent.change(screen.getByLabelText("Cost center"), { target: { value: "OPS-100" } });
    fireEvent.change(screen.getByLabelText("Needed by"), { target: { value: "2027-01-31" } });
    fireEvent.change(screen.getByLabelText("Business justification"), {
      target: { value: "Replace unsupported equipment" },
    });
    await user.click(screen.getByRole("button", { name: "Create draft" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const request = fetchMock.mock.calls[1];
    expect(JSON.parse(request[1].body)).toEqual(expect.objectContaining({ departmentId }));
    expect(push).toHaveBeenCalledWith("/requests/7d46f23f-0a21-4f18-b487-d4eb79708e85");
  });
});
