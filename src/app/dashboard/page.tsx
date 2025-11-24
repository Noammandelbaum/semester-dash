import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export default async function DashboardPage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Header */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
            SemesterDash
          </h1>

          <div className="flex items-center gap-4">
            {session.user.image && (
              <img
                src={session.user.image}
                alt={session.user.name || "User"}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {session.user.name}
            </span>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="ghost" size="sm" type="submit">
                התנתק
              </Button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
            שלום, {session.user.name?.split(" ")[0]}! 👋
          </h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            מה נעשה היום?
          </p>
        </div>

        {/* Empty State */}
        <Card className="text-center py-12" hover={false}>
          <CardContent>
            <div className="text-6xl mb-4">📚</div>
            <CardTitle className="text-xl mb-2">אין קורסים עדיין</CardTitle>
            <CardDescription className="mb-6">
              בוא נתחיל! הוסף את הקורס הראשון שלך
            </CardDescription>
            <Button size="lg">
              + הוסף קורס
            </Button>
          </CardContent>
        </Card>

        {/* Quick Stats (will be populated later) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold" style={{ color: 'var(--color-primary)' }}>
                0
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                קורסים פעילים
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold" style={{ color: 'var(--color-success)' }}>
                0
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                משימות שהושלמו
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="text-center py-6">
              <div className="text-3xl font-bold" style={{ color: 'var(--color-warning)' }}>
                0
              </div>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                דדליינים השבוע
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
