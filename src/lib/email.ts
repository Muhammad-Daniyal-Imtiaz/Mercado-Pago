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
  const fromEmail = process.env.SMTP_FROM || process.env.EMAIL_USER || 'noreply@alertapp.com';
  const subject = `🚀 Invitation: Join AlertApp as ${role.toUpperCase()}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a;">
      <h1 style="color: #2563eb; font-size: 24px;">Join the Team on AlertApp</h1>
      <p>Hello!</p>
      <p><strong>${invitedBy}</strong> has invited you to join their organization on AlertApp with the role of <strong>${role.replace('_', ' ')}</strong>.</p>
      <div style="background: #f4f4f5; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <p style="margin-bottom: 10px; font-size: 14px; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold;">Your Verification Code</p>
        <span style="font-size: 42px; font-weight: 900; letter-spacing: 0.2em; color: #09090b;">${invitationLink}</span>
      </div>
      <p>Please enter this code on the <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/verify-email">verification page</a> to complete your setup.</p>


      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;" />
      <p style="font-size: 12px; color: #a1a1aa;">This invitation expires on ${expiresAt.toLocaleDateString()}. If you weren't expecting this, you can safely ignore this email.</p>
    </div>
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