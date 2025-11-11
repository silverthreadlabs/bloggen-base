# Chat Module

A complete chat system built with AI SDK, React Query, and AI Elements.

## 📦 Architecture

```
chat/
├── index.ts                  # Main exports
├── types.ts                  # TypeScript types
├── chat-container.tsx        # Data fetching layer
├── chat-interface.tsx        # Main chat orchestrator
├── ui/
│   ├── chat-view.tsx        # Layout wrapper
│   ├── chat-header.tsx      # Header with branding
│   ├── chat-input.tsx       # Message input
│   ├── empty-state.tsx      # Welcome screen
│   └── message-*.tsx        # Message components
├── selectors/               # UI controls
└── utils/                   # Helper functions
```

## 🚀 Usage

### In App Routes

```tsx
// app/(chat)/chat/page.tsx - New chat
import { ChatContainer } from '@/components/chat/chat-container';

export default async function ChatPage() {
  const chatId = generateUUID();
  return <ChatContainer chatId={chatId} key={chatId} isNewChat />;
}
```

```tsx
// app/(chat)/chat/[id]/page.tsx - Existing chat
import { ChatContainer } from '@/components/chat/chat-container';

export default async function ChatDetailPage({ params }: Props) {
  const { id } = await params;
  return <ChatContainer chatId={id} />;
}
```

## 🔄 Component Flow

**1. ChatContainer** (`chat-container.tsx`)
- Receives `chatId` and optional `isNewChat` flag
- Fetches existing chat from database (skipped for new chats)
- Renders `ChatInterface` with loading states

**2. ChatInterface** (`chat-interface.tsx`)
- Manages AI SDK `useChat` hook
- Handles message operations (save, delete, regenerate)
- Syncs with React Query cache
- Passes state to `ChatView`

**3. ChatView** (`ui/chat-view.tsx`)
- Layout wrapper with sidebar and main content
- Renders conversation and input areas
- No business logic, pure presentation

## ⚙️ Configuration

### API Endpoint

AI requests go to `/api/chat` by default. Configure in `ChatInterface`:

```typescript
const { messages, sendMessage } = useChat({
  api: '/api/chat', // Change endpoint here
});
```

### Database Integration

Chat persistence uses React Query hooks from `lib/hooks/chat`:

```typescript
const { data: existingChat } = useChat(chatId);        // Fetch chat
const { mutate: createChat } = useCreateChat();        // Create chat
const { mutate: saveMessage } = useCreateMessage();    // Save message
```

### Customize Branding

Edit `ui/chat-header.tsx`:

```typescript
<h1>AI Assistant</h1>  // Change title
<p>Powered by AI SDK</p>  // Change subtitle
```

## 📋 Dependencies

### External Packages
```bash
pnpm install ai @ai-sdk/react @tanstack/react-query sonner lucide-react
```

### Internal Dependencies
- `@/components/ai-elements/*` - AI Elements UI components
- `@/lib/hooks/chat` - React Query hooks for chat/message CRUD
- `@/lib/actions/chat-actions` - Server actions for database operations
- `@/lib/stores/chat-pin-store` - Pin state management

## 🔌 API Route

The chat API is at `app/api/chat/route.ts`. Key features:
- AI SDK streaming with OpenAI
- Message history handling
- Web search integration
- Error handling

## ✨ Features

### Core Functionality
- **Real-time AI streaming** via AI SDK
- **Persistent storage** with React Query + database
- **Message operations**: Save, delete, regenerate
- **Chat management**: Create, pin, delete conversations
- **Web search integration** (optional per message)
- **File attachments** support

### UI Features  
- Auto-scroll conversation
- Loading states
- Empty state with suggestions
- Message actions (copy, regenerate, delete)
- Pinned chats sidebar
- Dark mode support

## 🎨 Styling

Uses CSS custom properties:
- `--canvas-*` for backgrounds and text
- `--primary-*` for user messages and buttons
- `--secondary-*` for assistant messages
- `--alert-*` for destructive actions

## 📤 Main Exports

```typescript
// Main components
export { ChatContainer } from './chat-container';
export { ChatInterface } from './chat-interface';

// UI components
export { ChatHeader, ChatInput, ChatView, EmptyState } from './ui';

// Selectors
export { LengthSelector, ToneSelector } from './selectors';
```

## 🔄 Data Flow

### New Chat Flow
1. User navigates to `/chat`
2. Server generates new UUID
3. `ChatContainer` renders with `isNewChat=true`
4. `ChatInterface` initializes without database fetch
5. User sends first message
6. Message triggers chat creation in database
7. Subsequent messages auto-save

### Existing Chat Flow
1. User navigates to `/chat/[id]`
2. `ChatContainer` fetches chat from database via React Query
3. Loading state shown while fetching
4. `ChatInterface` renders with `initialChat` data
5. Messages load from database
6. New messages auto-save

### Message Operations
- **Save**: Automatically persists after AI response
- **Delete**: Removes from UI and database, triggers trailing message cleanup
- **Regenerate**: Deletes trailing messages, re-streams last response
- **Copy**: Client-side only, no persistence

## 🗄️ State Management

### React Query (Server State)
- `useChat(chatId)` - Fetch individual chat
- `useChats()` - List all user chats
- `useCreateChat()` - Create new chat
- `useCreateMessage()` - Save message
- `useDeleteMessage()` - Delete message
- Automatic cache invalidation and refetching

### Local State (UI State)
- Pinned chats (`chat-pin-store`)
- Input text and modifiers
- Web search toggle
- Microphone toggle

### AI SDK State
- Streaming messages (`useChat` hook)
- Loading/error states
- Message parts handling

## 🛠️ Key Hooks

### From `lib/hooks/chat`
```typescript
// Queries
const { data: chat } = useChat(chatId);
const { data: chats } = useChats();

// Mutations  
const { mutate: createChat } = useCreateChat();
const { mutate: saveMessage } = useCreateMessage();
const { mutate: deleteMsg } = useDeleteMessage();
```

### From AI SDK
```typescript
const { messages, sendMessage, status, stop, regenerate } = useChat({
  api: '/api/chat',
  body: { /* metadata */ },
});
```
