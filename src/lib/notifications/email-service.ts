/**
 * Email Service - STUB
 *
 * This is a stub implementation that logs instead of sending emails.
 * To enable real email sending:
 * 1. Sign up for Resend (free tier: 100 emails/day)
 * 2. Add RESEND_API_KEY to .env
 * 3. Uncomment Resend implementation below
 */

import type { Assignment, Course } from "@prisma/client";

interface ReminderEmailData {
  to: string;
  userName: string;
  assignment: Assignment & { course: Course };
}

/**
 * Send a deadline reminder email (STUB)
 * Currently logs to console instead of sending actual email
 */
export async function sendReminderEmail(data: ReminderEmailData): Promise<void> {
  const { to, userName, assignment } = data;

  // STUB: Log instead of sending
  console.log("[EMAIL STUB] Would send reminder email:");
  console.log(`  To: ${to}`);
  console.log(`  User: ${userName}`);
  console.log(`  Assignment: ${assignment.title}`);
  console.log(`  Course: ${assignment.course.name}`);
  console.log(`  Due: ${assignment.dueDate.toLocaleDateString("he-IL")}`);

  // TODO: Implement with Resend when ready
  // const resend = new Resend(process.env.RESEND_API_KEY);
  // await resend.emails.send({
  //   from: "SemesterHub <notifications@semesterhub.club>",
  //   to: [to],
  //   subject: `תזכורת: ${assignment.title} - ${assignment.course.name}`,
  //   html: `
  //     <div dir="rtl" style="font-family: sans-serif;">
  //       <h2>היי ${userName},</h2>
  //       <p>רק תזכורת: המשימה <strong>${assignment.title}</strong> בקורס ${assignment.course.name} מגיעה מחר.</p>
  //       <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/courses/${assignment.courseId}">
  //         לצפייה במשימה
  //       </a>
  //     </div>
  //   `,
  // });
}

/**
 * Check if email notifications are enabled and configured
 */
export function isEmailEnabled(): boolean {
  // Always return false for stub implementation
  return false;

  // TODO: When implementing real emails:
  // return !!process.env.RESEND_API_KEY;
}
