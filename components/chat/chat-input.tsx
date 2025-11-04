'use client';

import {
  PromptInput,
  PromptInputBody,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTools,
  PromptInputButton,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionAddAttachments,
  PromptInputHeader,
  PromptInputAttachments,
  PromptInputAttachment,
  type PromptInputMessage,
} from '@/components/ai-elements/prompt-input';
import { GlobeIcon, MicIcon } from 'lucide-react';

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
          >
            <MicIcon size={16} />
            <span className="sr-only">Microphone</span>
          </PromptInputButton>
          <PromptInputButton
            onClick={() => onWebSearchChange(!useWebSearch)}
            variant={useWebSearch ? 'solid' : 'ghost'}
          >
            <GlobeIcon size={16} />
            <span>Search</span>
          </PromptInputButton>
        </PromptInputTools>
        <PromptInputSubmit
          disabled={!(text.trim() || status)}
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
