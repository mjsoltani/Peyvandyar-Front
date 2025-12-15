"use client";

import { useEffect } from "react";

export function ClarityProvider() {
  useEffect(() => {
    // Initialize Clarity
    import("@microsoft/clarity").then((module) => {
      const Clarity = module.default;
      Clarity.init("um1f6g7c32");
    });
  }, []);

  return null;
}
