import { AlertTriangle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ConflictResult } from '@/lib/conflict-checker';
import { format } from 'date-fns';

interface ConflictWarningProps {
  conflictResult: ConflictResult;
  onIgnore?: () => void;
  onSuggestTime?: (suggestion: string) => void;
}

export function ConflictWarning({ 
  conflictResult, 
  onIgnore, 
  onSuggestTime 
}: ConflictWarningProps) {
  if (!conflictResult.hasConflict) {
    return null;
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-800">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
          <div className="flex-1 space-y-3">
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Conflicto de horario detectado
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Este bloque se superpone con los siguientes eventos:
              </p>
            </div>

            {/* Conflicting blocks list */}
            <div className="space-y-2">
              {conflictResult.conflictingBlocks.map((block) => (
                <div 
                  key={block.id}
                  className="flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-md"
                >
                  <Clock className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <div className="flex-1">
                    <div className="font-medium text-yellow-800 dark:text-yellow-200 text-sm">
                      {block.title}
                    </div>
                    <div className="text-xs text-yellow-600 dark:text-yellow-400">
                      {format(new Date(block.startTime), 'HH:mm')} - {format(new Date(block.endTime), 'HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggestions */}
            {conflictResult.suggestions.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                  Sugerencias:
                </p>
                <div className="space-y-1">
                  {conflictResult.suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => onSuggestTime?.(suggestion)}
                      className="block w-full text-left text-sm text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-100 hover:underline"
                    >
                      • {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onIgnore}
                className="text-yellow-700 border-yellow-300 hover:bg-yellow-100 dark:text-yellow-300 dark:border-yellow-700 dark:hover:bg-yellow-900"
              >
                Crear de todas formas
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}