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

  const handleFileAdd = useCallback((filesWithIds: Array<{ id: string; file: File }>) => {
    for (const { id, file } of filesWithIds) {
      const validation = validateFile(file);
      if (!validation.valid) {
        toast.error(`${file.name}: ${validation.error}`);
        continue;
      }
      fileUploads.uploadFile(id, file);
    }
  }, [fileUploads]);

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
        <div className="w-full">
          <PromptInputTools className="w-full flex flex-col md:flex-row items-baseline">

            <div className="flex gap-2 mb-3">
              <ToneSelector value={tone} onChange={onToneChangeAction} disabled={disabled} />
              <LengthSelector value={length} onChange={onLengthChangeAction} disabled={disabled} />
            </div>

            <div className="flex items-center justify-between w-full">

              <div className="flex items-center gap-3">
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger className="h-10 w-10" />
                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>

                <PromptInputSpeechButton
                  textareaRef={textareaRef}
                  onTranscriptionChange={(transcribedText) => onTextChangeAction(transcribedText)}
                  disabled={disabled}
                  className="h-10 w-10"
                />

                {/* <PromptInputButton
                  onClick={() => onWebSearchChangeAction(!useWebSearch)}
                  variant={useWebSearch ? "solid" : "ghost"}
                  disabled={disabled}
                  className="h-10 px-3.5"
                >
                  <GlobeIcon size={16} />
                  <span className="md:inline">Search</span>
                </PromptInputButton> */}
              </div>

              <PromptInputSubmit
                disabled={disabled || fileUploads.isAnyUploading() || !(text.trim() || context.trim())}
                status={status}
                className="shrink-0"
                onClick={(e) => {
                  if (status === "streaming") {
                    e.preventDefault();
                    onStopAction();
                  }
                }}
              />
            </div>

          </PromptInputTools>
        </div>
      </PromptInputFooter>
    </PromptInput>
  );
}
