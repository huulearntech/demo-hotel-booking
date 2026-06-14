import { PATHS } from "@/lib/constants";
import SignInForm from "./sign-in-form";

export default async function SignInPage({
  searchParams
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const { callbackUrl = PATHS.home } = await searchParams;
  return <SignInForm callbackUrl={callbackUrl} />;
}