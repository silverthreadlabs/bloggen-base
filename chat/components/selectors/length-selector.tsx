'use client';

import { TextIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LENGTH_LABELS, type LengthOption } from '@/chat/utils';


type Props = {
  value: LengthOption;
  onChange: (value: LengthOption) => void;
  disabled?: boolean;
};

export function LengthSelector({ value, onChange, disabled = false }: Props) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="h-8 w-auto text-xs">
        <div className="flex items-center gap-1.5">
          <TextIcon size={14} className="text-muted-foreground" />
          <SelectValue placeholder="Length" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {(Object.keys(LENGTH_LABELS) as LengthOption[]).map((length) => (
          <SelectItem key={length} value={length} className="text-xs">
            {LENGTH_LABELS[length]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
