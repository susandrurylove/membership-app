import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

function source(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("Susan Drury responsive brand system", () => {
  it("uses the light ivory theme and no legacy dark shell backgrounds", () => {
    const styles = source("client/src/index.css");
    const shell = source("client/src/components/MemberShell.tsx");
    const dashboard = source("client/src/pages/Home.tsx");

    expect(styles).toContain("--background: oklch(0.985 0.009 84)");
    expect(styles).toContain("background-image:");
    expect(shell).not.toContain('bg-[#0e1634]');
    expect(dashboard).not.toContain('bg-[#0e1634]');
  });

  it("provides a fixed mobile navigation and a separate desktop navigation", () => {
    const shell = source("client/src/components/MemberShell.tsx");
    const styles = source("client/src/index.css");
    const admin = source("client/src/pages/Admin.tsx");
    const button = source("client/src/components/ui/button.tsx");

    expect(shell).toContain('className={mobile ? "grid w-full" : "hidden items-center gap-1 lg:flex"}');
    expect(shell).toContain("fixed inset-x-0 bottom-0");
    expect(shell).toContain("lg:hidden");
    expect(shell).toContain("safe-area-inset-bottom");
    expect(shell).toContain("focus-visible:ring-2");
    expect(styles).toContain("min-height: 44px");
    expect(button).toContain("min-h-11 min-w-11");
    expect(button).toContain("sm:min-h-0 sm:min-w-0");
    expect(admin).toContain('url.searchParams.delete("dialog")');
    expect(admin).toContain("qa-focus-admin");
    expect(shell).toContain('qaFocusHref === item.href');

    const brandLink = shell.indexOf('<Link href="/"');
    const desktopNavigation = shell.indexOf("<Navigation />");
    const signOut = shell.indexOf("<button", desktopNavigation);
    const mobileNavigation = shell.lastIndexOf("<Navigation mobile />");
    expect(brandLink).toBeGreaterThan(-1);
    expect(desktopNavigation).toBeGreaterThan(brandLink);
    expect(signOut).toBeGreaterThan(desktopNavigation);
    expect(mobileNavigation).toBeGreaterThan(signOut);
  });

  it("keeps narrow app cards and administrator dialogs within the viewport", () => {
    const apps = source("client/src/pages/Apps.tsx");
    const members = source("client/src/pages/admin/MembersPanel.tsx");
    const courses = source("client/src/pages/admin/CoursesPanel.tsx");
    const teachings = source("client/src/pages/admin/TeachingsPanel.tsx");
    const mediaViewer = source("client/src/components/MediaViewer.tsx");
    const teachingDetail = source("client/src/pages/TeachingDetail.tsx");
    const courseDetail = source("client/src/pages/CourseDetail.tsx");

    expect(apps).toContain("Setup pending");
    expect(apps).toContain('className="sm:hidden"');
    expect(members).toContain('className="space-y-3 md:hidden"');
    expect(members).toContain('hidden overflow-x-auto rounded-[1.5rem] md:block');
    expect(mediaViewer).toContain('className="aspect-video w-full bg-black"');
    expect(mediaViewer).toContain('className="w-full"');
    expect(teachingDetail).toContain("text-4xl");
    expect(teachingDetail).toContain("max-w-[1180px]");
    expect(courseDetail).toContain("lg:grid-cols-[330px_minmax(0,1fr)]");
    expect(courseDetail).toContain("lg:sticky lg:top-28");
    for (const panel of [members, courses, teachings]) {
      expect(panel).toContain("max-h-[90dvh]");
      expect(panel).toContain("w-[calc(100%-2rem)]");
    }
  });
});
