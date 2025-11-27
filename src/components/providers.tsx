/**
 * Providers - Configuração de provedores globais da aplicação
 * @author Gabriel Amaral (https://www.instagram.com/sougabrielamaral/) - 2025-11-27
 */
"use client"

import { SessionProvider } from "next-auth/react"
import { ThemeProvider } from "next-themes"

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  )
}