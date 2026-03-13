import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 'placeholder');

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, name, confirmationUrl } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const { data, error } = await resend.emails.send({
      from: 'Launch by Gravity <noreply@gravity.culture>',
      to: email,
      subject: 'Verify your Launch account',
      html: `
        <div style="font-family: Inter, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px; color: #fafafa; background: #0a0a0f;">
          <h1 style="font-size: 24px; font-weight: 600; margin-bottom: 8px;">Welcome to Launch${name ? `, ${name}` : ''}</h1>
          <p style="color: #8888a0; font-size: 14px; line-height: 1.6; margin-bottom: 24px;">
            Click the button below to verify your email address and get started.
          </p>
          <a href="${confirmationUrl}" style="display: inline-block; padding: 12px 24px; background: #1f3f6d; color: #fafafa; text-decoration: none; border-radius: 12px; font-size: 14px; font-weight: 500;">
            Verify Email
          </a>
          <p style="color: #44445a; font-size: 12px; margin-top: 32px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('[send-verification] Resend error:', error);
      return NextResponse.json({ error: 'Failed to send verification email' }, { status: 500 });
    }

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (err) {
    console.error('[send-verification] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
