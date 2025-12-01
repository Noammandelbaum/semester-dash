import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardContent } from "@/components/dashboard";

/**
 * Dashboard Page (STUDDASH-25)
 *
 * Server component that:
 * 1. Validates authentication
 * 2. Renders DashboardContent client component
 *
 * Data fetching happens client-side via useDashboard hook
 * for better UX (loading states, refresh on focus)
 */
export default async function DashboardPage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  return <DashboardContent />;
}
