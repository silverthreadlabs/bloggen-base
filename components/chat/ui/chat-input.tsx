'use client';

import { GlobeIcon, MicIcon } from 'lucide-react';
import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputHeader,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import type { LengthOption, ToneOption } from '@/lib/config/message-modifiers';
import { LengthSelector, ToneSelector } from '../selectors';

type Props = {
  text: string;
  context: string;
  onTextChangeAction: (text: string) => void;
  onContextChangeAction: (context: string) => void;
  imageUrl: string;
  onImageUrlChangeAction: (imageUrl: string) => void;
  useWebSearch: boolean;
  onWebSearchChangeAction: (use: boolean) => void;
  useMicrophone: boolean;
  onMicrophoneChangeAction: (use: boolean) => void;
  tone: ToneOption;
  onToneChangeAction: (tone: ToneOption) => void;
  length: LengthOption;
  onLengthChangeAction: (length: LengthOption) => void;
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  onSubmitAction: (message: PromptInputMessage) => void;
  onStopAction: () => void;
  disabled?: boolean;
};

export function ChatInput({
  text,
  context,
  onTextChangeAction,
  onContextChangeAction,
  imageUrl,
  onImageUrlChangeAction,
  useWebSearch,
  onWebSearchChangeAction,
  useMicrophone,
  onMicrophoneChangeAction,
  tone,
  onToneChangeAction,
  length,
  onLengthChangeAction,
  status,
  onSubmitAction,
  onStopAction,
  disabled = false,
}: Props) {
  return (
    <PromptInput globalDrop multiple onSubmit={onSubmitAction}>
      <PromptInputHeader>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
      </PromptInputHeader>
      <PromptInputBody>
        <PromptInputTextarea
          onChange={(event) => onContextChangeAction(event.target.value)}
          value={context}
          disabled={disabled}
          placeholder="Additional instructions (optional)"
          className="min-h-12 max-h-24 mb-2 text-sm"
          name="context"
        />
        <PromptInputTextarea
          onChange={(event) => onImageUrlChangeAction(event.target.value)}
          value={imageUrl}
          disabled={disabled}
          placeholder="Image URL (optional)"
          className="min-h-12 max-h-16 mb-2 text-sm"
          name="imageUrl"
        />
        <PromptInputTextarea
          onChange={(event) => onTextChangeAction(event.target.value)}
          value={text}
          disabled={disabled}
        />
      </PromptInputBody>
      <PromptInputFooter>
        <PromptInputTools>
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger />
            <PromptInputActionMenuContent>
              <PromptInputActionAddAttachments />
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
          <ToneSelector
            value={tone}
            onChange={onToneChangeAction}
            disabled={disabled}
          />
          <LengthSelector
            value={length}
            onChange={onLengthChangeAction}
            disabled={disabled}
          />
          <PromptInputButton
            onClick={() => onMicrophoneChangeAction(!useMicrophone)}
            variant={useMicrophone ? 'solid' : 'ghost'}
            disabled={disabled}
          >
            <MicIcon size={16} />
            <span className="sr-only">Microphone</span>
          </PromptInputButton>
          <PromptInputButton
            onClick={() => onWebSearchChangeAction(!useWebSearch)}
            variant={useWebSearch ? 'solid' : 'ghost'}
            disabled={disabled}
          >
            <GlobeIcon size={16} />
            <span>Search</span>
          </PromptInputButton>
        </PromptInputTools>
        <PromptInputSubmit
          disabled={disabled || !(text.trim() || status)}
          status={status}
          onClick={(e) => {
            if (status === 'streaming') {
              e.preventDefault();
              onStopAction();
            }
          }}
        />
      </PromptInputFooter>
    </PromptInput>
  );
}
