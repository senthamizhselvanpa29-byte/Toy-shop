// Which ways customers can log in. Email codes work out of the box; mobile OTP
// needs an SMS provider in Supabase, and Google needs a Google sign-in setup.
// Turn them on in Vercel → Settings → Environment Variables.
export const loginMethods = {
  phone: process.env.NEXT_PUBLIC_LOGIN_PHONE === "1",
  google: process.env.NEXT_PUBLIC_LOGIN_GOOGLE === "1",
};
