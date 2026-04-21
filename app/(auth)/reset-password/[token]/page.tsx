// If the token is invalid or expired, return a expired page and do not render the reset password form.
// import { getSession } from "@/lib/session";
// import { verifyResetToken } from "@/lib/auth";
// import ResetPasswordForm from "@/components/ResetPasswordForm";

// export default async function ResetPasswordPage(params: Promise<{token: string}>) {
//   const { token } = await params;

//   // Verify the reset token
//   const isValidToken = await verifyResetToken(token);

//   return <ResetPasswordForm token={token} />;
// }

export default function ResetPasswordPage() {
  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Reset Password</h1>
      <p className="text-sm text-muted-foreground mb-6">
        to be implemented... but you can try to open the page with any token and it should show the expired message. For example: <code>/reset-password/invalid-token</code>
      </p>
    </div>
  );
}