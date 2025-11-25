'use client';

import { GlobeIcon } from 'lucide-react';
import { useRef, useCallback } from 'react';
import { toast } from 'sonner';
import { getFileInputAccept } from '@/lib/utils/file-types';
import { validateFile } from '@/lib/utils/file-validation';
import type { useFileUploads } from '@/lib/hooks/use-file-uploads';
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

const MAX_FILES = 2;

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
  fileUploads: ReturnType<typeof useFileUploads>;
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
  fileUploads,
  onSubmitAction,
  onStopAction,
  disabled = false,
}: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Handle file additions - upload immediately using IDs from PromptInput
  const handleFileAdd = useCallback((filesWithIds: Array<{ id: string; file: File }>) => {
    for (const { id, file } of filesWithIds) {
      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }

      // Start upload using the ID from PromptInput
      fileUploads.uploadFile(id, file);
    }
  }, [fileUploads]);

  // Handle file removal - delete from server if uploaded
  const handleFileRemove = useCallback((fileId: string) => {
    fileUploads.removeFile(fileId);
  }, [fileUploads]);

  return (
    <PromptInput
      globalDrop
      multiple
      accept={getFileInputAccept()}
      maxFiles={MAX_FILES}
      maxFileSize={5 * 1024 * 1024} // 5MB
      onError={(error) => {
        toast.error(error.message);
      }}
      onSubmit={onSubmitAction}
      onFileAdd={handleFileAdd}
      onFileRemove={handleFileRemove}
    >
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
        <div className="w-full h-px bg-canvas-line"></div>

        {/* <PromptInputTextarea
          onChange={(event) => onImageUrlChangeAction(event.target.value)}
          value={imageUrl}
          disabled={disabled}
          placeholder="Image URL (optional)"
          className="min-h-12 max-h-16 mb-2 text-sm"
          name="imageUrl"
        /> */}
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
          {/* <PromptInputSpeechButton
            textareaRef={textareaRef}
            onTranscriptionChange={(transcribedText) => {
              onTextChangeAction(transcribedText);
            }}
            disabled={disabled}
          /> */}
          {/* <PromptInputButton
            onClick={() => onWebSearchChangeAction(!useWebSearch)}
            variant={useWebSearch ? 'solid' : 'ghost'}
            disabled={disabled}
          >
            <GlobeIcon size={16} />
            <span>Search</span>
          </PromptInputButton> */}
        </PromptInputTools>
        <div className='flex flex-row items-center gap-2'>
          <PromptInputSpeechButton
            textareaRef={textareaRef}
            onTranscriptionChange={(transcribedText) => {
              onTextChangeAction(transcribedText);
            }}
            disabled={disabled}
          />
          <PromptInputSubmit
            disabled={disabled || fileUploads.isAnyUploading() || !(text.trim() || status)}
            status={status}
            iconOnly
            onClick={(e) => {
              if (status === 'streaming') {
                e.preventDefault();
                onStopAction();
              }
            }}
          />
        </div>
      </PromptInputFooter>
    </PromptInput>
  );
}
