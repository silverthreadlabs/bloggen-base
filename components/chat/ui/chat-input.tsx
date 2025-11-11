'use client';

import { GlobeIcon } from 'lucide-react';
import { useRef } from 'react';
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
  PromptInputSpeechButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import type { LengthOption, ToneOption } from '@/lib/config/message-modifiers';
import { LengthSelector, ToneSelector } from '../selectors';

type Props = {
  text: string;
  onTextChangeAction: (text: string) => void;
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
  onTextChangeAction,
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <PromptInput globalDrop multiple onSubmit={onSubmitAction}>
      <PromptInputHeader>
        <PromptInputAttachments>
          {(attachment) => <PromptInputAttachment data={attachment} />}
        </PromptInputAttachments>
      </PromptInputHeader>
      <PromptInputBody>
        <PromptInputTextarea
          ref={textareaRef}
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
          <PromptInputSpeechButton
            textareaRef={textareaRef}
            onTranscriptionChange={(transcribedText) => {
              onTextChangeAction(transcribedText);
            }}
            disabled={disabled}
          />
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
