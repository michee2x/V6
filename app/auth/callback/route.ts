import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  // "next" is in case we have a next parameter indicating where to go after login
  const next = searchParams.get('next') ?? '/';
  
  // if "type" is present and equals "signup", it might be an email confirmation
  const type = searchParams.get('type');

  if (code) {
    if (type === 'signup') {
      // Prevent email bots from prematurely consuming the verification token.
      // Redirect to a manual verification page.
      return NextResponse.redirect(`${origin}/verify-email?code=${code}&next=${next}`);
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      if (type === 'recovery') {
        // Redirect to password reset form
        return NextResponse.redirect(`${origin}/update-password`);
      }
      
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      
      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${next}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`);
      } else {
        return NextResponse.redirect(`${origin}${next}`);
      }
    }
  }

  // return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/login?error=Could not verify the authentication code.`);
}
