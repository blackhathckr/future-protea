import { useState } from 'react'
import { useTheme } from 'next-themes'
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Type,
  RotateCcw,
  Check,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useColorTheme, themeDepthOptions, type ThemeDepth } from '@/components/providers/color-theme-provider'
import { useFont } from '@/components/providers/font-provider'
import { colorPalettes, type ColorPalette } from '@/lib/color-palettes'
import { fontConfigs, type FontConfig } from '@/config/fonts'

interface ThemeDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * ThemeDrawer
 *
 * Slide-out drawer for comprehensive theme customization.
 * Provides access to appearance mode, color palettes with depth levels, and fonts.
 */
export function ThemeDrawer({ open, onOpenChange }: ThemeDrawerProps) {
  const { theme, setTheme } = useTheme()
  const { paletteId, depth, setPalette, setDepth, resetToDefault, isDefault } = useColorTheme()
  const { fontId, setFont, resetFont, isDefault: isFontDefault } = useFont()
  const [activeTab, setActiveTab] = useState<'appearance' | 'palette' | 'font'>('appearance')

  const handleReset = () => {
    resetToDefault()
    resetFont()
    setTheme('system')
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full max-w-md p-0 flex flex-col" showCloseButton={true}>
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle className="text-lg font-semibold">Customize Theme</SheetTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            Personalize your experience
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4 shrink-0" variant="line">
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="palette" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Palette
            </TabsTrigger>
            <TabsTrigger value="font" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              Font
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4">
            <TabsContent value="appearance" className="mt-0 space-y-6 data-[state=active]:block" forceMount>
              {activeTab === 'appearance' && (
                <>
                  <AppearanceSelector theme={theme} setTheme={setTheme} />
                  <DepthSelector selectedDepth={depth} onSelect={setDepth} />
                </>
              )}
            </TabsContent>

            <TabsContent value="palette" className="mt-0 space-y-6 data-[state=active]:block" forceMount>
              {activeTab === 'palette' && (
                <PaletteSelector
                  selectedId={paletteId}
                  onSelect={setPalette}
                />
              )}
            </TabsContent>

            <TabsContent value="font" className="mt-0 space-y-6 data-[state=active]:block" forceMount>
              {activeTab === 'font' && (
                <FontSelector
                  selectedId={fontId}
                  onSelect={setFont}
                />
              )}
            </TabsContent>
          </div>
        </Tabs>

        <SheetFooter className="px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isDefault && isFontDefault && theme === 'system'}
            className="w-full gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

/**
 * AppearanceSelector - Light/Dark/System mode toggle
 */
function AppearanceSelector({
  theme,
  setTheme,
}: {
  theme: string | undefined
  setTheme: (theme: string) => void
}) {
  const modes = [
    { id: 'light', label: 'Light', icon: Sun, description: 'Always use light mode' },
    { id: 'dark', label: 'Dark', icon: Moon, description: 'Always use dark mode' },
    { id: 'system', label: 'System', icon: Monitor, description: 'Follow system preference' },
  ]

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">Mode</h3>
        <p className="text-xs text-muted-foreground">Select your preferred color mode</p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {modes.map((mode) => (
          <button
            key={mode.id}
            onClick={() => setTheme(mode.id)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all',
              theme === mode.id
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            <mode.icon className={cn(
              'h-6 w-6',
              theme === mode.id ? 'text-primary' : 'text-muted-foreground'
            )} />
            <span className={cn(
              'text-sm font-medium',
              theme === mode.id ? 'text-foreground' : 'text-muted-foreground'
            )}>
              {mode.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * PaletteSelector - Grid of color palettes
 */
function PaletteSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string
  onSelect: (id: string) => void
}) {
  // Group palettes by category
  const categories = [
    { id: 'warm', label: 'Warm' },
    { id: 'cool', label: 'Cool' },
    { id: 'vibrant', label: 'Vibrant' },
    { id: 'neutral', label: 'Neutral' },
  ] as const

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">Color Palette</h3>
        <p className="text-xs text-muted-foreground">Choose a color scheme for the interface</p>
      </div>
      {categories.map((category) => {
        const palettes = colorPalettes.filter((p) => p.category === category.id)
        if (palettes.length === 0) return null

        return (
          <div key={category.id}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category.label}
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {palettes.map((palette) => (
                <PaletteCard
                  key={palette.id}
                  palette={palette}
                  selected={selectedId === palette.id}
                  onSelect={() => onSelect(palette.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * PaletteCard - Individual palette option
 */
function PaletteCard({
  palette,
  selected,
  onSelect,
}: {
  palette: ColorPalette
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all',
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      {/* Color Preview - 3 circles */}
      <div className="flex w-full gap-1.5">
        <div
          className="h-6 w-6 rounded-full border border-white/20 shadow-sm"
          style={{ backgroundColor: palette.light.primary }}
        />
        <div
          className="h-6 w-6 rounded-full border border-white/20 shadow-sm"
          style={{ backgroundColor: palette.light.accent }}
        />
        <div
          className="h-6 w-6 rounded-full border border-white/20 shadow-sm"
          style={{ backgroundColor: palette.light.secondary }}
        />
      </div>

      {/* Info */}
      <div className="flex w-full items-center gap-2">
        <span className="text-base">{palette.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {palette.name}
          </div>
          <div className="truncate text-xs text-muted-foreground">
            {palette.description}
          </div>
        </div>
        {selected && (
          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Check className="h-3 w-3" />
          </div>
        )}
      </div>
    </button>
  )
}

/**
 * DepthSelector - Controls theme intensity
 */
function DepthSelector({
  selectedDepth,
  onSelect,
}: {
  selectedDepth: ThemeDepth
  onSelect: (depth: ThemeDepth) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">Depth</h3>
        <p className="text-xs text-muted-foreground">Control how much of the interface is affected</p>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {themeDepthOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onSelect(option.value)}
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border px-2 py-3 text-center transition-all',
              selectedDepth === option.value
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                : 'border-border hover:border-primary/50 hover:bg-muted/50'
            )}
          >
            <span className={cn(
              'text-xs font-medium',
              selectedDepth === option.value ? 'text-primary' : 'text-foreground'
            )}>
              {option.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/**
 * FontSelector - List of fonts with preview
 */
function FontSelector({
  selectedId,
  onSelect,
}: {
  selectedId: string
  onSelect: (id: string) => void
}) {
  // Group fonts by category
  const categories = [
    { id: 'sans', label: 'Sans Serif' },
    { id: 'mono', label: 'Monospace' },
    { id: 'system', label: 'System' },
  ] as const

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium text-foreground mb-1">Font Family</h3>
        <p className="text-xs text-muted-foreground">Choose a font for the interface</p>
      </div>
      {categories.map((category) => {
        const fonts = fontConfigs.filter((f) => f.category === category.id)
        if (fonts.length === 0) return null

        return (
          <div key={category.id}>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {category.label}
            </h4>
            <div className="space-y-2">
              {fonts.map((font) => (
                <FontCard
                  key={font.id}
                  font={font}
                  selected={selectedId === font.id}
                  onSelect={() => onSelect(font.id)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * FontCard - Individual font option with preview
 */
function FontCard({
  font,
  selected,
  onSelect,
}: {
  font: FontConfig
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all',
        selected
          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
          : 'border-border hover:border-primary/50 hover:bg-muted/50'
      )}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg font-bold text-foreground"
        style={{ fontFamily: font.name }}
      >
        Aa
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-medium text-foreground">{font.name}</div>
        <div className="text-sm text-muted-foreground">{font.description}</div>
      </div>
      {selected && (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="h-4 w-4" />
        </div>
      )}
    </button>
  )
}

/**
 * ThemeDrawerTrigger - Button to open the theme drawer
 */
export function ThemeDrawerTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className="h-9 w-9"
      title="Customize Theme"
    >
      <Palette className="h-5 w-5" />
      <span className="sr-only">Customize theme</span>
    </Button>
  )
}
