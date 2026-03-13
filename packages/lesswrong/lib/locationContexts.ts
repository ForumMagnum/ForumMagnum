"use client";
import React, { createContext } from "react";
import type { RouterLocation } from "./routeChecks/parseRoute";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const LocationContext = createContext<RouterLocation|null>(null);
export const SubscribeLocationContext = createContext<RouterLocation|null>(null);
export const NavigationContext = createContext<{ history: AppRouterInstance }|null>(null);