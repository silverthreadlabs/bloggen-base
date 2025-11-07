import { NodeToolbar, Position } from '@xyflow/react';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/utils';

type ToolbarProps = ComponentProps<typeof NodeToolbar>;

export const Toolbar = ({ className, ...props }: ToolbarProps) => (
  <NodeToolbar
    className={cn(
      'flex items-center gap-1 rounded-sm border border-canvas-border bg-canvas-bg p-1.5',
      className,
    )}
    position={Position.Bottom}
    {...props}
  />
);
