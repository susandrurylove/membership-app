// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const invalidate = vi.fn();
const testState = vi.hoisted(() => ({ members: [] as any[] }));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: {
      id: 1,
      name: "Susan Drury",
      email: "susan@example.com",
      isAdmin: true,
      hasPortalAccess: true,
      membership: { tier: "platinum", status: "active" },
    },
    loading: false,
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({
      admin: {
        members: { list: { invalidate } },
        overview: { invalidate },
        categories: { list: { invalidate } },
        teachings: { list: { invalidate } },
        courses: { list: { invalidate }, detail: { invalidate } },
        media: { list: { invalidate } },
      },
      member: {
        teachings: { list: { invalidate }, categories: { invalidate } },
        courses: { list: { invalidate } },
      },
    }),
    admin: {
      members: {
        list: {
          useQuery: () => ({ data: testState.members, error: null, isLoading: false, refetch: vi.fn() }),
        },
        create: {
          useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
        },
        updateAccess: {
          useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
        },
        refreshInvitation: {
          useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }),
        },
      },
      overview: { useQuery: () => ({ data: {}, error: null, isLoading: false, refetch: vi.fn() }) },
      categories: {
        list: { useQuery: () => ({ data: [], error: null, isLoading: false, refetch: vi.fn() }) },
        save: { useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }) },
      },
      teachings: {
        list: { useQuery: () => ({ data: [], error: null, isLoading: false, refetch: vi.fn() }) },
        save: { useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }) },
      },
      courses: {
        list: { useQuery: () => ({ data: [], error: null, isLoading: false, refetch: vi.fn() }) },
        detail: { useQuery: () => ({ data: null, error: null, isLoading: false, refetch: vi.fn() }) },
        save: { useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }) },
        saveSection: { useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }) },
        saveLesson: { useMutation: () => ({ mutate: vi.fn(), isPending: false, error: null }) },
      },
      media: {
        list: { useQuery: () => ({ data: [], error: null, isLoading: false, refetch: vi.fn() }) },
      },
    },
    member: {
      media: {
        url: { useQuery: () => ({ data: { url: "https://example.com/qa-media" }, error: null, isLoading: false, refetch: vi.fn() }) },
      },
    },
  },
}));

import { MediaViewer } from "./components/MediaViewer";
import { MemberShell } from "./components/MemberShell";
import Admin from "./pages/Admin";
import { CoursesPanel } from "./pages/admin/CoursesPanel";
import { MediaPanel } from "./pages/admin/MediaPanel";
import { MembersPanel } from "./pages/admin/MembersPanel";
import { TeachingsPanel } from "./pages/admin/TeachingsPanel";

beforeAll(() => {
  Object.defineProperty(globalThis, "ResizeObserver", {
    configurable: true,
    value: class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  });
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { value: vi.fn(), configurable: true });
  Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", { value: vi.fn(() => false), configurable: true });
  Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", { value: vi.fn(), configurable: true });
});

beforeEach(() => {
  window.history.replaceState(null, "", "/");
  testState.members = [];
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("keyboard-only protected portal navigation", () => {
  it("moves logically through brand, desktop navigation, sign out, and member content", async () => {
    const user = userEvent.setup();
    render(<MemberShell><button type="button">Primary member action</button></MemberShell>);

    const orderedTargets = [
      screen.getByRole("link", { name: /Susan Drury/i }),
      screen.getAllByRole("link", { name: "Home" })[0],
      screen.getAllByRole("link", { name: "Teachings" })[0],
      screen.getAllByRole("link", { name: "Courses" })[0],
      screen.getAllByRole("link", { name: "Susan’s Apps" })[0],
      screen.getAllByRole("link", { name: "Administration" })[0],
      screen.getByRole("button", { name: "Sign out" }),
      screen.getByRole("button", { name: "Primary member action" }),
    ];

    for (const target of orderedTargets) {
      await user.tab();
      expect(document.activeElement).toBe(target);
    }
    expect(orderedTargets[1].className).toContain("focus-visible:ring-2");
  });

  it("opens the administrator dialog by keyboard, autofocuses its first field, and traps tab focus", async () => {
    window.history.replaceState(null, "", "/admin?tab=members");
    const user = userEvent.setup();
    render(<MembersPanel />);

    await user.tab();
    const inviteButton = screen.getByRole("button", { name: "Invite member" });
    expect(document.activeElement).toBe(inviteButton);
    expect(inviteButton.className).toContain("focus-visible:ring");
    expect(inviteButton.className).toContain("min-h-11");
    expect(inviteButton.className).toContain("min-w-11");
    await user.keyboard("{Enter}");

    const dialog = await screen.findByRole("dialog");
    const nameInput = screen.getByLabelText("Name");
    await waitFor(() => expect(document.activeElement).toBe(nameInput));

    for (let index = 0; index < 12; index += 1) {
      await user.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    const createButton = screen.getByRole("button", { name: "Create invitation" });
    expect(createButton.className).toContain("w-full");
    expect(dialog.className).toContain("max-h-[90dvh]");
  });

  it("reaches and opens teaching and course editors through keyboard controls", async () => {
    const user = userEvent.setup();
    render(<TeachingsPanel />);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "New category" }));
    await user.tab();
    const teachingButton = screen.getByRole("button", { name: "New teaching" });
    expect(document.activeElement).toBe(teachingButton);
    expect(teachingButton.className).toContain("focus-visible:ring");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Title")));
    await user.keyboard("{Escape}");

    cleanup();
    render(<CoursesPanel />);
    const courseButton = screen.getByRole("button", { name: "New course" });
    await user.tab();
    expect(document.activeElement).toBe(courseButton);
    expect(courseButton.className).toContain("focus-visible:ring");
    await user.keyboard("{Enter}");
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText("Course title")));
  });

  it("tabs through real media upload controls in a logical order", async () => {
    const user = userEvent.setup();
    render(<MediaPanel />);

    const file = screen.getByLabelText("File");
    const description = screen.getByLabelText("Image description or media note");
    const upload = screen.getByRole("button", { name: "Upload" });
    for (const control of [file, description, upload]) {
      await user.tab();
      expect(document.activeElement).toBe(control);
    }
    expect(upload.className).toContain("focus-visible:ring");
  });

  it("renders a focused administrator tab plus mobile-card and desktop-table member variants", () => {
    window.history.replaceState(null, "", "/admin?tab=members&qa-focus-admin=members");
    testState.members = [{
      user: { id: 1, name: "Susan Drury", email: "susan@example.com", role: "admin", accountStatus: "active" },
      membership: { tier: "platinum", status: "active", endsAt: null, internalNotes: null },
      invitation: null,
    }];

    const { container } = render(<Admin />);
    expect(screen.getByRole("tab", { name: "Members" }).className).toContain("ring-2 ring-[#c9a84c]");
    expect(container.querySelector("article")?.parentElement?.className).toContain("md:hidden");
    const table = container.querySelector("table");
    expect(table).not.toBeNull();
    const tableScroll = table?.closest("div");
    expect(tableScroll?.className).toContain("overflow-x-auto");
    expect(tableScroll?.parentElement?.className).toContain("md:block");
  });

  it("renders fluid video, audio, and image media surfaces", () => {
    const baseAsset = { id: 1, originalName: "Susan teaching", mimeType: "video/mp4", altText: "Susan teaching artwork" };
    const { container, rerender } = render(<MediaViewer asset={{ ...baseAsset, kind: "video" }} />);
    expect(container.querySelector("video")?.className).toContain("aspect-video w-full");

    rerender(<MediaViewer asset={{ ...baseAsset, kind: "audio", mimeType: "audio/mpeg" }} />);
    expect(container.querySelector("audio")?.className).toContain("w-full");

    rerender(<MediaViewer asset={{ ...baseAsset, kind: "image", mimeType: "image/jpeg" }} />);
    const image = container.querySelector("img");
    expect(image?.className).toContain("h-auto w-full");
    expect(image?.getAttribute("alt")).toBe("Susan teaching artwork");
  });
});
