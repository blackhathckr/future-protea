import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trophy, X } from 'lucide-react'
import { toast } from 'sonner'
import { TournamentService } from '@/services/cricket/tournament.service'

interface TournamentLogoUploadProps {
  tournamentId?: string; // Optional if we are in "create" mode
  currentLogoUrl?: string;
  onLogoChange?: (file: File | null) => void;
  onLogoDeleted?: () => void;
  onLogoUploaded?: (url: string) => void;
}

export function TournamentLogoUpload({ tournamentId, currentLogoUrl, onLogoChange, onLogoDeleted, onLogoUploaded }: TournamentLogoUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogoUrl || null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB')
      return
    }

    // Set preview
    const reader = new FileReader()
    reader.onloadend = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(file)

    if (onLogoChange) {
      onLogoChange(file)
    }

    // If we have a tournamentId, upload immediately
    if (tournamentId) {
      try {
        setIsUploading(true)
        const updatedTournament = await TournamentService.uploadTournamentLogo(tournamentId, file)
        toast.success('Logo uploaded successfully')
        if (onLogoUploaded && updatedTournament.logo_url) {
          onLogoUploaded(updatedTournament.logo_url)
        }
      } catch (error) {
        toast.error('Failed to upload logo')
        setPreviewUrl(currentLogoUrl || null) // Revert preview on failure
      } finally {
        setIsUploading(false)
      }
    }
  }

  const handleDelete = async () => {
    // Note: Backend doesn't have an explicit DELETE endpoint for tournament logo yet.
    // Usually handled by uploading null, but let's just clear preview for now if creating.
    // If we want to delete an existing logo, we might need to add that to backend/service.
    // For now we'll simulate by clearing the local state.
    
    setPreviewUrl(null)
    if (onLogoChange) onLogoChange(null)
    if (onLogoDeleted) onLogoDeleted()
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative group">
        {previewUrl ? (
          <div className="relative w-24 h-24 rounded-full border-2 border-border overflow-hidden">
            <img src={previewUrl} alt="Tournament Logo" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Button type="button" variant="ghost" size="icon" className="text-white hover:text-red-500" onClick={handleDelete} disabled={isUploading}>
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="w-24 h-24 rounded-full border-2 border-dashed border-muted-foreground/50 flex flex-col items-center justify-center bg-muted/20 text-muted-foreground">
            <Trophy className="h-8 w-8 mb-1 opacity-50" />
            <span className="text-[10px] uppercase font-semibold tracking-wider">No Logo</span>
          </div>
        )}
      </div>

      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleFileChange}
            disabled={isUploading}
            className="w-full max-w-xs cursor-pointer"
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Recommended: Square image, transparent background (PNG). Maximum size: 2MB.
        </p>
      </div>
    </div>
  )
}
