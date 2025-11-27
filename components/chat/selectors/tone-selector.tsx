'use client';

import { SparklesIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TONE_LABELS, type ToneOption } from '@/lib/config/message-modifiers';

type Props = {
  value: ToneOption;
  onChange: (value: ToneOption) => void;
  disabled?: boolean;
};

export function ToneSelector({ value, onChange, disabled = false }: Props) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8 w-auto text-xs">
        <div className="flex items-center gap-1.5">
          <SparklesIcon size={14} className="text-muted-foreground" />
          <SelectValue placeholder="Tone" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(TONE_LABELS) as ToneOption[]).map((tone) => (
          <SelectItem key={tone} value={tone} className="text-xs">
            {TONE_LABELS[tone]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
