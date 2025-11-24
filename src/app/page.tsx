import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { CircularProgress, Progress } from "@/components/ui/progress";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center min-h-screen p-8">
        <div className="animate-slide-up text-center max-w-4xl">
          {/* Logo/Brand */}
          <h1 className="text-5xl font-bold mb-4" style={{ color: 'var(--color-primary)' }}>
            SemesterDash
          </h1>

          <p className="text-xl mb-8" style={{ color: 'var(--color-text-secondary)' }}>
            ניהול סמסטר חכם - כל מה שצריך במקום אחד
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center mb-16">
            <Button size="xl">
              התחל עכשיו
            </Button>
            <Button variant="secondary" size="xl">
              למד עוד
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-right">
              <CardHeader>
                <div className="text-3xl mb-2">📚</div>
                <CardTitle>קורסים</CardTitle>
                <CardDescription>נהל את כל הקורסים שלך במקום אחד</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-right">
              <CardHeader>
                <div className="text-3xl mb-2">✅</div>
                <CardTitle>משימות</CardTitle>
                <CardDescription>עקוב אחרי הגשות, שיעורים ומעבדות</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-right">
              <CardHeader>
                <div className="text-3xl mb-2">📈</div>
                <CardTitle>התקדמות</CardTitle>
                <CardDescription>ראה בדיוק איפה אתה עומד</CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Progress Demo */}
          <div className="mt-16">
            <h2 className="text-2xl font-semibold mb-8" style={{ color: 'var(--color-text-primary)' }}>
              דוגמה לתצוגת התקדמות
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Course Card Demo */}
              <Card className="text-right">
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <CircularProgress value={75} size={60} />
                    <div className="flex-1 mr-4">
                      <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        מבוא למדעי המחשב
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        67101 | 4 נ״ז
                      </p>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: 'var(--color-course-indigo)' }}
                    />
                  </div>
                  <Progress value={75} showLabel size="md" />
                </CardContent>
              </Card>

              {/* Course Card Demo 2 */}
              <Card className="text-right">
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <CircularProgress value={45} size={60} />
                    <div className="flex-1 mr-4">
                      <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                        אלגברה לינארית 1
                      </h3>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        80134 | 5 נ״ז
                      </p>
                    </div>
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: 'var(--color-course-purple)' }}
                    />
                  </div>
                  <Progress value={45} showLabel size="md" />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Course Color Palette */}
          <div className="mt-12">
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              צבעים לקורסים
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {[
                'var(--color-course-red)',
                'var(--color-course-orange)',
                'var(--color-course-amber)',
                'var(--color-course-green)',
                'var(--color-course-teal)',
                'var(--color-course-blue)',
                'var(--color-course-indigo)',
                'var(--color-course-purple)',
                'var(--color-course-pink)',
              ].map((color, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full shadow-md transition-transform hover:scale-110"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Button Variants Demo */}
          <div className="mt-12">
            <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>
              סוגי כפתורים
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="success">Success</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="primary" isLoading>Loading</Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
