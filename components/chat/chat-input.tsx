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

type Props = {
  text: string;
  onTextChange: (text: string) => void;
  useWebSearch: boolean;
  onWebSearchChange: (use: boolean) => void;
  useMicrophone: boolean;
  onMicrophoneChange: (use: boolean) => void;
  status: 'submitted' | 'streaming' | 'ready' | 'error';
  onSubmit: (message: PromptInputMessage) => void;
  onStop: () => void;
  disabled?: boolean;
};

export function ChatInput({
  text,
  onTextChange,
  useWebSearch,
  onWebSearchChange,
  useMicrophone,
  onMicrophoneChange,
  status,
  onSubmit,
  onStop,
  disabled = false,
}: Props) {
  return (
    <PromptInput globalDrop multiple onSubmit={onSubmit}>
      <PromptInputHeader>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
      </PromptInputHeader>
      <PromptInputBody>
        <PromptInputTextarea
          onChange={(event) => onTextChange(event.target.value)}
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
          <PromptInputButton
            onClick={() => onMicrophoneChange(!useMicrophone)}
            variant={useMicrophone ? 'solid' : 'ghost'}
            disabled={disabled}
          >
            <MicIcon size={16} />
            <span className="sr-only">Microphone</span>
          </PromptInputButton>
          <PromptInputButton
            onClick={() => onWebSearchChange(!useWebSearch)}
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
              onStop();
            }
          }}
        />
      </PromptInputFooter>
    </PromptInput>
  );
}
