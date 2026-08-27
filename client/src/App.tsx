import { MemberShell } from "@/components/MemberShell";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AcceptInvitation from "@/pages/AcceptInvitation";
import Admin from "@/pages/Admin";
import Apps from "@/pages/Apps";
import CourseDetail from "@/pages/CourseDetail";
import Courses from "@/pages/Courses";
import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import TeachingDetail from "@/pages/TeachingDetail";
import Teachings from "@/pages/Teachings";
import { useEffect, type ReactNode } from "react";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";

function MemberPage({ children, requireAdmin = false }: { children: ReactNode; requireAdmin?: boolean }) {
  return (
    <ProtectedRoute requireAdmin={requireAdmin}>
      <MemberShell>{children}</MemberShell>
    </ProtectedRoute>
  );
}

function ScrollToTop() {
  const [location] = useLocation();
  const pathname = location.split("?")[0];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <Switch>
      <Route path="/login" component={Login} />
      <Route path="/accept-invitation" component={AcceptInvitation} />
      <Route path="/teachings/:slug">{() => <MemberPage><TeachingDetail /></MemberPage>}</Route>
      <Route path="/teachings">{() => <MemberPage><Teachings /></MemberPage>}</Route>
      <Route path="/courses/:slug">{() => <MemberPage><CourseDetail /></MemberPage>}</Route>
      <Route path="/courses">{() => <MemberPage><Courses /></MemberPage>}</Route>
      <Route path="/apps">{() => <MemberPage><Apps /></MemberPage>}</Route>
      <Route path="/admin">{() => <MemberPage requireAdmin><Admin /></MemberPage>}</Route>
      <Route path="/">{() => <MemberPage><Home /></MemberPage>}</Route>
      <Route>{() => <MemberPage><NotFound /></MemberPage>}</Route>
      </Switch>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
