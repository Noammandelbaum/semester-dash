import { redirect } from "next/navigation";

/**
 * Onboarding Index Page
 *
 * Redirects to the first step (welcome page)
 */
export default function OnboardingPage() {
  redirect("/onboarding/welcome");
}
