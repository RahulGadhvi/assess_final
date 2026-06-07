"use client";

import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Container wrapper pass-through */}
      <div className="flex-1 min-h-screen">
        {children}
      </div>
    </div>
  );
}