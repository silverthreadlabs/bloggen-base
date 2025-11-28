import type { UIMessage } from 'ai';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps, HTMLAttributes } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage['role'];
};

export const Message = ({ className, from, ...props }: MessageProps) => (
  <div
    className={cn(
      'group flex w-full items-start gap-2 py-4',
      from === 'user' ? 'is-user justify-end' : 'is-assistant justify-start',
      className,
    )}
    {...props}
  />
);

const messageContentVariants = cva(
  'flex flex-col gap-2 overflow-hidden text-sm',
  {
    variants: {
      variant: {
        contained: [
          'px-4 py-3',
          // Use a softer background for user messages to reduce visual harshness
          'group-[.is-user]:bg-canvas-bg group-[.is-user]:text-canvas-text-contrast group-[.is-user]:rounded-lg group-[.is-user]:max-w-fit',
          'group-[.is-assistant]:bg-transparent group-[.is-assistant]:text-canvas-text-contrast group-[.is-assistant]:w-full',
        ],
        flat: [
          'group-[.is-user]:bg-secondary-bg group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-canvas-text-contrast group-[.is-user]:rounded-lg group-[.is-user]:max-w-fit',
          'group-[.is-assistant]:text-canvas-text-contrast group-[.is-assistant]:w-full',
        ],
      },
    },
    defaultVariants: {
      variant: 'contained',
    },
  },
);

export type MessageContentProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof messageContentVariants>;

export const MessageContent = ({
  children,
  className,
  variant,
  ...props
}: MessageContentProps) => (
  <div
    className={cn(messageContentVariants({ variant, className }))}
    {...props}
  >
    {children}
  </div>
);

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src: string;
  name?: string;
};

export const MessageAvatar = ({
  src,
  name,
  className,
  ...props
}: MessageAvatarProps) => (
  <Avatar
    className={cn('size-8 ring-1 ring-canvas-border', className)}
    {...props}
  >
    <AvatarImage alt="" className="mt-0 mb-0" src={src} />
    <AvatarFallback>{name?.slice(0, 2) || 'ME'}</AvatarFallback>
  </Avatar>
);
