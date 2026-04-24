import { FilterForm, FilterForm__Reset_and_Apply_Buttons } from "./filter-form";
import {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetPortal,
  SheetOverlay,
  SheetClose,
} from '@/components/ui/sheet';
import { Content as SheetContent } from '@radix-ui/react-dialog';
import { ListFilter, XIcon } from 'lucide-react';
import { cn } from '@/lib/utils';


export default function Filter() {
  return (
    <>
      <Filter__Desktop />
      <Filter__Mobile showCloseButton/>
    </>
  );
};

function Filter__Desktop() {
  return (
    <aside className="hidden sticky h-full min-h-screen top-23.5 lg:flex w-full max-w-62.5 flex-col gap-y-3 z-10">
      <FilterForm__Reset_and_Apply_Buttons />
      <FilterForm />
    </aside>
  );
};

export function Filter__Mobile({
  className,
  side = 'left',
  children,
  showCloseButton = false,
  standAlone = false,
  ...props
}: React.ComponentProps<typeof SheetContent> & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
  standAlone?: boolean
}) {
  return (
    <SheetPortal>
      <SheetOverlay
        data-responsive={!Boolean(standAlone)}
        className={cn("z-1001 data-[responsive=true]:lg:hidden")}
      />
      <SheetContent
        data-slot="sheet-content"
        data-responsive={!Boolean(standAlone)}
        className={cn(
          "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
          side === "right" &&
          "data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right inset-y-0 right-0 h-full max-w-3/4 border-l sm:max-w-sm",
          side === "left" &&
          "data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left inset-y-0 left-0 h-full max-w-3/4 border-r sm:max-w-sm",
          side === "top" &&
          "data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top inset-x-0 top-0 h-auto border-b",
          side === "bottom" &&
          "data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom inset-x-0 bottom-0 h-auto border-t",
          "z-1002 data-[responsive=true]:lg:hidden",
          className
        )}
        {...props}
      >
        <SheetHeader className='sticky top-0 left-0 right-0 flex-row items-center justify-between backdrop-blur-md bg-white/20 z-10'>
          <SheetTitle className='flex gap-2 items-center'>
            <ListFilter className="size-5" aria-hidden />
            <span className="text-lg font-bold">Bộ lọc</span>
          </SheetTitle>
          {showCloseButton && (
            <SheetClose className="ring-offset-background focus:ring-ring data-[state=open]:bg-secondary rounded-xs opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none">
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          )}
          <SheetDescription className='sr-only' > Tuỳ chỉnh bộ lọc tìm kiếm của bạn </SheetDescription>
        </SheetHeader>

        <FilterForm isSheet />

        <SheetFooter className='sticky bottom-0 left-0 right-0 backdrop-blur-md bg-white/20 z-10'>
          <FilterForm__Reset_and_Apply_Buttons />
        </SheetFooter>
      </SheetContent>
    </SheetPortal>
  );
};

export const FilterSheet = Filter__Mobile;