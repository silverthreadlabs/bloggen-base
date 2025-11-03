# Chat Module

A complete, self-contained chat interface built with AI SDK and AI Elements.

## 📦 Structure

```
chat/
├── index.ts                  # Main exports
├── types.ts                  # TypeScript types
├── chat-client.tsx           # Main chat component
├── chat-header.tsx           # Header with branding
├── chat-data.ts              # Demo/mock data
├── message-avatar.tsx        # Avatar display
├── empty-state.tsx           # Welcome screen
├── hooks/
│   └── use-chat-actions.ts   # Copy functionality
└── utils/
    └── message-utils.ts      # Helper functions
```

## 🚀 Usage

```tsx
import { ChatClient } from '@/components/chat';

export default function ChatPage() {
  return <ChatClient session={session} />;
}
```

## ⚙️ Configuration

### Toggle Mock/Real AI

In `chat-client.tsx`, line 54:

```typescript
const USE_HARDCODED_MESSAGES = true; // false for real AI
```

### Change API Endpoint

In `chat-client.tsx`, line 72:

```typescript
api: '/api/chat', // Change to your endpoint
```

### Customize Branding

In `chat-header.tsx`:

```typescript
<h1>AI Assistant</h1>  // Change title
<p>Powered by AI SDK</p>  // Change subtitle
```

### Customize Suggestions

In `chat-data.ts`:

```typescript
export const suggestions = [
  'Your custom suggestion 1',
  'Your custom suggestion 2',
];
```

### Customize Mock Responses

In `chat-data.ts`:

```typescript
export const mockResponses = [
  'Your custom response...',
];
```

## 📋 Dependencies

### NPM Packages
```bash
npm install ai @ai-sdk/react @ai-sdk/openai nanoid sonner lucide-react
```

### Internal Components
- `@/components/ai-elements/*` - AI Elements library
- `@/components/ui/button` - Button component

## 🔌 API Setup

Create `app/api/chat/route.ts`:

```typescript
import { streamText, convertToModelMessages } from 'ai';
import { openai } from '@ai-sdk/openai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  
  const result = streamText({
    model: openai('gpt-4o-mini'),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
```

Add to `.env.local`:
```env
OPENAI_API_KEY=your_key_here
```

## ✨ Features

- Real-time streaming responses
- Message actions (copy, regenerate, delete)
- File attachments support
- Voice input toggle
- Web search toggle  
- Suggestion chips
- Auto-scroll
- Mock mode for demos
- Dark mode support

## 🎨 Customization

All styling uses CSS variables:
- `--canvas-bg`, `--canvas-text`
- `--primary-solid`, `--primary-text-contrast`
- `--secondary-bg-hover`, `--secondary-text-contrast`

## 📤 Exports

```typescript
// Components
export { ChatClient, ChatHeader, MessageAvatar, EmptyState };

// Types
export type { HardcodedMessageType, ChatStatus, UIMessage };

// Data
export { hardcodedMessages, suggestions, mockResponses };

// Hooks & Utils
export { useChatActions };
export { extractMessageText, isLastAssistantMessage };
```

## 🎯 Portability

- ✅ Self-contained - all logic in `chat/` folder
- ✅ No app-specific dependencies
- ✅ Easy to customize - edit constants directly
- ✅ Full TypeScript support
- ✅ Works standalone

## 📝 Notes

- Start with `USE_HARDCODED_MESSAGES = true` to test without API key
- Switch to `false` and add `OPENAI_API_KEY` for real AI
- Edit `chat-data.ts` to customize demo content
- All configuration is inline - no complex config system


## 🏗️ Structure

```
components/chat/
├── chat-client.tsx          # Main orchestrator component
├── chat-header.tsx          # Header with branding and actions
├── chat-input.tsx           # Message input using AI Elements PromptInput
├── message-avatar.tsx       # User/assistant avatars
├── empty-state.tsx          # Empty conversation state
├── hooks/
│   └── use-chat-actions.ts  # Copy action state management
└── utils/
    └── message-utils.ts     # Message processing utilities
```

## ✨ Features

### AI Elements Integration
- **Conversation**: Manages message display with auto-scroll
- **Message**: Structured message layout with role-based styling
- **MessageContent**: Content wrapper with variants
- **Response**: Markdown/streaming content renderer
- **Loader**: Built-in loading indicator
- **Actions**: Message actions (copy, regenerate, delete)
- **PromptInput**: Complete input solution with Submit/Stop buttons

### Component Isolation
- **No prop drilling**: Each component receives only what it needs
- **Reusable**: Components can be used independently
- **Type-safe**: Full TypeScript support throughout

### Custom Hooks
- `useChatActions`: Manages copy-to-clipboard with feedback

### Utility Functions
- `extractMessageText`: Extracts text from message parts
- `isLastAssistantMessage`: Determines if message can be regenerated

### Actions
- **Copy**: Copy message text to clipboard with visual feedback (✓ icon on success)
- **Regenerate**: Regenerate last assistant response
- **Delete**: Remove user messages from conversation
- **Stop**: Cancel streaming responses (built into PromptInput)

## 🎨 Styling

Uses custom color system:
- `canvas-*` for backgrounds and text
- `primary-*` for user messages and buttons
- `secondary-*` for assistant messages and avatars
- `alert-*` for stop button
- `success-*` for copy confirmation

## 🔧 Usage

```tsx
import { ChatClient } from '@/components/chat';

export default function ChatPage() {
  return <ChatClient session={session} />;
}
```

## 📦 Dependencies

- `@ai-sdk/react` - AI SDK React hooks (`useChat`)
- `ai` - AI SDK core with `DefaultChatTransport`
- `@/components/ai-elements` - **Primary UI components**:
  - `Conversation`, `ConversationContent`, `ConversationScrollButton`
  - `Message`, `MessageContent`
  - `Response` (streaming markdown)
  - `Loader` (typing indicator)
  - `Actions`, `Action` (message actions)
  - `PromptInput`, `PromptInputBody`, `PromptInputTextarea`, `PromptInputFooter`, `PromptInputSubmit`
- `@/components/ui` - Base UI components (Button, Avatar, etc.)

## 🚀 AI SDK v6 Integration

Follows the **AI SDK Elements example pattern**:
- ✅ Uses `useChat` with `DefaultChatTransport`
- ✅ Handles `messages.parts` for different content types
- ✅ Manages `status` for UI states (ready, submitted, streaming, error)
- ✅ Implements `sendMessage`, `regenerate`, `stop`, and `setMessages`
- ✅ Uses AI Elements components for consistent UI/UX
- ✅ Leverages `Conversation` for auto-scroll and message management
- ✅ Uses `Response` component for markdown rendering
- ✅ Integrates `PromptInput` with submit/stop functionality

## 📝 Key Differences from Custom Implementation

**Before** (Custom Components):
- Manual message layout and styling
- Custom input with form handling
- Separate loading indicator component
- Manual scroll management

**After** (AI Elements):
- `Conversation` handles layout and auto-scroll
- `PromptInput` provides complete input solution
- `Loader` built-in for status='submitted'
- `Response` for content rendering
- Consistent with AI SDK documentation examples
