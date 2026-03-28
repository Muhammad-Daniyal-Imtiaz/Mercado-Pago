import nodemailer from 'nodemailer';

console.log('Using Email User:', process.env.EMAIL_USER); // Log the user to double check

export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER || process.env.SMTP_USER,
    pass: process.env.EMAIL_PASS || process.env.SMTP_PASSWORD,
  },
});




export const sendEmail = async ({ to, subject, html }: { to: string; subject: string; html: string }) => {
  const mailOptions = {
    from: process.env.SMTP_FROM || `AlertApp <${process.env.EMAIL_USER}>`,

    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};
