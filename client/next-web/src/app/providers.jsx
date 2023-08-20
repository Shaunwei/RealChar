// app/providers.jsx
'use client'

import { NextUIProvider } from '@nextui-org/react'

export function Providers({ children }) {
  return (
    <NextUIProvider>
      {children}
    </NextUIProvider>
  )
}
