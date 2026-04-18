import Link from 'next/link';
import Image from 'next/image';

import { auth } from "@/auth";
import { user_getInfoById } from "@/lib/actions/user-account";
import { PATHS } from '@/lib/constants'
import { cn } from '@/lib/utils';

import HeaderAvatar from './header-avatar';
import { Button } from '@/components/ui/button';
import { HeartIcon } from 'lucide-react';
import { tvlk_logo_text_dark } from "@/public/logos"


export default async function Header({ className }: { className?: string }) {
  const session = await auth();
  const user = session ? await user_getInfoById(session.user.id) : null;

  return (
    <header className={cn("w-full flex items-center bg-white shadow-md z-10 h-20", className)}>
      <div className="flex justify-between items-center content">
        <Link href={PATHS.home}>
          <Image
            src={tvlk_logo_text_dark}
            alt=""
            className="h-10 w-auto object-contain"
          />
        </Link>
        {user ? (
          <div className="flex items-center gap-x-8">
            <Link href={PATHS.favorites}>
              <HeartIcon className="size-6" strokeWidth={2} />
            </Link>
            <HeaderAvatar {...user} />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Button asChild variant="link" className="hidden md:block text-black">
              <Link href={PATHS.signUpHotel}>
                Đăng ký cơ sở lưu trú của bạn
              </Link>
            </Button>
            <Button asChild variant="outline" className="text-primary hover:text-primary">
              <Link href={PATHS.signIn}> Đăng nhập </Link>
            </Button>
            <Button asChild>
              <Link href={PATHS.signUp}> Đăng ký </Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};