/**
 * ThemeToggle - Componente para alternar entre Dark/Light mode
 * @author Gabriel Amaral (https://www.instagram.com/sougabrielamaral/) - 2025-11-27
 */
"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useEffect, useState } from "react"

export function ThemeToggle() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    // Evita hidratação mismatch
    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <Sun className="h-5 w-5" />
            </Button>
        )
    }

    const isDark = theme === "dark"

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(isDark ? "light" : "dark")}
                        className="relative"
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Alternar tema</span>
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{isDark ? "Modo Claro" : "Modo Escuro"}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
