"use client";

import * as React from "react";
import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "./ui/input-group";
import { cn } from "@/lib/utils";

export default React.forwardRef(function PasswordInput(
  { className, ...props }: React.ComponentProps<"input">,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const [visible, setVisible] = useState(false);

  return (
    <InputGroup className={cn(
      "w-auto",
      "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
      className
    )}>
      <InputGroupInput
        ref={ref as any}
        type={visible ? "text" : "password"}
        className="text-sm md:text-base"
        {...props}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          size="icon-xs"
          variant="ghost"
          data-slot="input-group-button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? <EyeOffIcon className="pointer-events-none" /> : <EyeIcon className="pointer-events-none" />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
});