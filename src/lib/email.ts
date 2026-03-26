import { sendEmail } from './nodemailer';

export async function sendInvitationEmail({
  to,
  invitedBy,
  role,
  invitationLink,
  expiresAt
}: {
  to: string
  invitedBy: string
  role: string
  invitationLink: string
  expiresAt: Date
}) {
  const subject = `You've been invited to join as ${role}`;
  const html = `
    <h1>Invitation to Join</h1>
    <p>You have been invited by ${invitedBy} to join as a <strong>${role}</strong>.</p>
    <p>Please use the following 6-digit code to complete your registration:</p>
    <h2>${invitationLink}</h2>
    <p>This code will expire at: ${expiresAt.toLocaleString()}</p>
    <p>Thank you!</p>
  `;

  await sendEmail({ to, subject, html });
}

export async function sendPasswordResetEmail({
  to,
  resetLink
}: {
  to: string
  resetLink: string
}) {
  console.log(`Sending password reset email to ${to}: ${resetLink}`)
}

export async function sendWelcomeEmail({
  to,
  name
}: {
  to: string
  name: string
}) {
  console.log(`Sending welcome email to ${to} (${name})`)
}