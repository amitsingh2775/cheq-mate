
import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

const RESEND_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';

if (!RESEND_KEY) {
  throw new Error('RESEND_API_KEY is not set in environment');
}

const resend = new Resend(RESEND_KEY);

// default timeout for external email call
const DEFAULT_TIMEOUT_MS = 10_000;

export const sendEmail = async (
  to: string,
  subject: string,
  text: string,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  options?: { html?: string }
): Promise<void> => {

  const html = options?.html ?? `<p>${text}</p>`;

  const call = resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
  console.log(call)

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Resend send timeout')), timeoutMs)
  );

  await Promise.race([call, timeout]);
};
