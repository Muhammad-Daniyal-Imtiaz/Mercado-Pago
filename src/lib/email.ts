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
  const subject = `🚀 Invitación: Sumate a Pay-Alert como ${role.toUpperCase()}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a;">
      <h1 style="color: #2563eb; font-size: 24px;">Unite al equipo en Pay-Alert</h1>
      <p>¡Hola!</p>
      <p><strong>${invitedBy}</strong> te invitó a unirte a su equipo en Pay-Alert con el rol de <strong>${role.replace('_', ' ')}</strong>.</p>
      <div style="background: #f4f4f5; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <p style="margin-bottom: 10px; font-size: 14px; color: #71717a; text-transform: uppercase; letter-spacing: 0.1em; font-weight: bold;">Tu Código de Verificación</p>
        <span style="font-size: 42px; font-weight: 900; letter-spacing: 0.2em; color: #09090b;">${invitationLink}</span>
      </div>
      <p>Ingresá este código en la <a href="https://pay-alert.com.ar/verify-email">página de verificación</a> para completar tu registro.</p>

      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;" />
      <p style="font-size: 12px; color: #a1a1aa;">Esta invitación expira el ${expiresAt.toLocaleDateString('es-AR')}. Si no la esperabas, podés ignorar este mail.</p>
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
  const subject = '🔐 Recuperá tu contraseña - Pay-Alert';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a;">
      <h1 style="color: #2563eb; font-size: 24px;">Recuperá tu contraseña</h1>
      <p>¡Hola!</p>
      <p>Recibimos una solicitud para restablecer tu contraseña en Pay-Alert.</p>
      <div style="background: #f4f4f5; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <a href="${resetLink}" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">Cambiar mi contraseña</a>
      </div>
      <p>Si no hiciste esta solicitud, podés ignorar este mail.</p>
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;" />
      <p style="font-size: 12px; color: #a1a1aa;">Pay-Alert - https://pay-alert.com.ar</p>
    </div>
  `;

  await sendEmail({ to, subject, html });
}

export async function sendWelcomeEmail({
  to,
  name
}: {
  to: string
  name: string
}) {
  const subject = '🎉 Bienvenido a Pay-Alert';
  const html = `
    <div style="font-family: sans-serif; padding: 20px; color: #1a1a1a;">
      <h1 style="color: #2563eb; font-size: 24px;">¡Bienvenido a Pay-Alert!</h1>
      <p>¡Hola ${name}!</p>
      <p>Tu cuenta fue creada exitosamente. Ya podés empezar a usar Pay-Alert para gestionar pagos y alertas de tus equipos.</p>
      <div style="background: #f4f4f5; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0;">
        <a href="https://pay-alert.com.ar/login" style="background: #2563eb; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; display: inline-block;">Iniciar sesión</a>
      </div>
      <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0;" />
      <p style="font-size: 12px; color: #a1a1aa;">Pay-Alert - https://pay-alert.com.ar</p>
    </div>
  `;

  await sendEmail({ to, subject, html });
}