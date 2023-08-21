// app/providers.jsx
'use client'

import { NextUIProvider } from '@nextui-org/react';
import { AuthContextProvider } from '@/context/AuthContext';

export function Providers({ children }) {
  return (
    <NextUIProvider>
      <AuthContextProvider>
        {children}
      </AuthContextProvider>
    </NextUIProvider>
  )
}
