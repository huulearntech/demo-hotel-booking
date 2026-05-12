import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import OtpForm from "./otp-form";

async function getActiveOtpById(id: string) {
  return prisma.verificationToken.findUnique({
    where: {
      id,
      type: "REGISTRATION",
      expiresAt: {
        gt: new Date(),
      },
    },
    select: {
      code: true,
      expiresAt: true,
      user: {
        select: {
          email: true,
          name: true,
        }
      }
    },
  });
}

export default async function OtpPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const otpData = await getActiveOtpById(id);

  if (!otpData) notFound();

  return (
    <main>
      <OtpForm id={id} email={otpData.user.email} name={otpData.user.name} />
    </main>
  );
}