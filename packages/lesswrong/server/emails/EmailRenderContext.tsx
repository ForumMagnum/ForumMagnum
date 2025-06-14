'use client';

import React from 'react';

type EmailRenderContextType = {
  isEmailRender: boolean;
};

export const EmailRenderContext = React.createContext<EmailRenderContextType | null>(null);
