import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ColorThemeProvider } from "@/components/providers/color-theme-provider"
import { FontProvider } from "@/components/providers/font-provider"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange={false}
    >
      <ColorThemeProvider>
        <FontProvider>
          {children}
        </FontProvider>
      </ColorThemeProvider>
    </NextThemesProvider>
  )
}
