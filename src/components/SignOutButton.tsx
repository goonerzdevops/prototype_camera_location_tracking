"use client";

import { signOut } from "next-auth/react";

interface SignOutButtonProps {
  style?: React.CSSProperties;
  children?: React.ReactNode;
}

export default function SignOutButton({ style, children }: SignOutButtonProps) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: `${window.location.origin}/` })}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        ...style,
      }}
    >
      {children ?? "Sign Out"}
    </button>
  );
}
