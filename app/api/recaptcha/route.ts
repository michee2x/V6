import { NextResponse } from 'next/server';

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = body?.token;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ success: false, error: 'Missing captcha token' }, { status: 400 });
    }

    const host = request.headers.get('host') || '';
    const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1');
    const secret = isLocalhost
      ? process.env.RECAPTCHA_SECRET_KEY_LOCALHOST ?? process.env.RECAPTCHA_SECRET_KEY
      : process.env.RECAPTCHA_SECRET_KEY;

    if (!secret) {
      return NextResponse.json({ success: false, error: 'reCAPTCHA secret is not configured' }, { status: 500 });
    }

    const formData = new URLSearchParams({
      secret,
      response: token,
    });

    const verifyResponse = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    if (!verifyResponse.ok) {
      return NextResponse.json({ success: false, error: 'Failed to verify captcha' }, { status: 502 });
    }

    const result = await verifyResponse.json();

    if (!result.success) {
      const errorCodes = Array.isArray(result['error-codes']) ? result['error-codes'].join(', ') : undefined;
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid captcha token',
          details: {
            'error-codes': result['error-codes'],
            description: errorCodes,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
