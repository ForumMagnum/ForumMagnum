'use client';

import React from 'react';
import type { RouterLocation } from '../vulcan-lib/routes';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

export interface ServerRequestStatusContextType {
  status?: number
  redirectUrl?: string
};

export const LocationContext = React.createContext<RouterLocation|null>(null);
export const SubscribeLocationContext = React.createContext<RouterLocation|null>(null);
export const NavigationContext = React.createContext<{ history: AppRouterInstance }|null>(null);
export const ServerRequestStatusContext = React.createContext<ServerRequestStatusContextType|null>(null);

