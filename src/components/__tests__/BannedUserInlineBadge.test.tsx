import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: true, error: null }),
  },
}));

import BannedUserInlineBadge from "@/components/BannedUserInlineBadge";

describe("BannedUserInlineBadge", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders BAN badge when user is banned", async () => {
    render(<BannedUserInlineBadge userId="user-1" />);
    await waitFor(() => {
      expect(screen.getByText(/БАН/i)).toBeInTheDocument();
    });
  });
});
