'use client';

import React, { createContext } from 'react';

export const TimezoneContext = React.createContext<string | null>(null);
export const UserContext = createContext<UsersCurrent | null>(null);

