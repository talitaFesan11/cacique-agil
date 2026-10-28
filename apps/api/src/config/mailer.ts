import nodemailer from 'nodemailer';
import { env } from './env.js';
import { logger } from './logger.js';

export interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const createTransport = () => {
  if (env.NODE_ENV === 'test') {
    return nodemailer.createTransport({
      jsonTransport: true,
    });
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
};

export const mailer = {
  async sendMail(options: SendMailOptions): Promise<void> {
    try {
      const transporter = createTransport();
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      logger.info({ to: options.to, subject: options.subject }, 'Email sent successfully');
    } catch (err) {
      logger.warn({ err, to: options.to, subject: options.subject }, 'Failed to send email via SMTP');
    }
  },
};
