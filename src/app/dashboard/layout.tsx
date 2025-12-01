import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout";
import { shouldShowOnboarding } from "@/lib/onboarding-utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  // Check if user needs onboarding (new user without semesters)
  const needsOnboarding = await shouldShowOnboarding(session.user.id);
  if (needsOnboarding) {
    redirect("/onboarding");
  }

  return (
    <AppShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      }}
    >
      {children}
    </AppShell>
  );
}
