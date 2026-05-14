import { memo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface ReportExportButtonProps {
  onExport: () => Promise<void> | void;
}

export const ReportExportButton = memo(function ReportExportButton({
  onExport,
}: ReportExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button variant="outline" size="sm" disabled={isExporting} onClick={handleExport}>
      {isExporting ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Download className="mr-2 h-4 w-4" />
      )}
      Export CSV
    </Button>
  );
});
