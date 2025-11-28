import { nanoid } from 'nanoid';
import type { HardcodedMessageType } from '@/chat/types';

// ============================================================================
// HARDCODED MESSAGES
// ============================================================================

export const hardcodedMessages: HardcodedMessageType[] = [
  {
    key: nanoid(),
    from: 'user',
    content: 'Can you explain how to use React hooks effectively?',
    avatar: 'https://github.com/haydenbleasel.png',
    name: 'Hayden Bleasel',
  },
  {
    key: nanoid(),
    from: 'assistant',
    content: `# React Hooks Best Practices

React hooks are a powerful feature that let you use state and other React features without writing classes. Here are some tips for using them effectively:

## Rules of Hooks

1. **Only call hooks at the top level** of your component or custom hooks
2. **Don't call hooks inside loops, conditions, or nested functions**

## Common Hooks

- **useState**: For local component state
- **useEffect**: For side effects like data fetching
- **useContext**: For consuming context
- **useReducer**: For complex state logic
- **useCallback**: For memoizing functions
- **useMemo**: For memoizing values

## Example of useState and useEffect

\`\`\`jsx
function ProfilePage({ userId }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    fetchUser(userId).then(userData => {
      setUser(userData);
    });
  }, [userId]);

  return user ? <Profile user={user} /> : <Loading />;
}
\`\`\`

Would you like me to explain any specific hook in more detail?`,
    avatar: 'https://github.com/openai.png',
    name: 'AI Assistant',
  },
  {
    key: nanoid(),
    from: 'user',
    content:
      'Yes, could you explain useCallback and useMemo in more detail? When should I use one over the other?',
    avatar: 'https://github.com/haydenbleasel.png',
    name: 'Hayden Bleasel',
  },
  {
    key: nanoid(),
    from: 'assistant',
    content: `## useCallback vs useMemo

Both hooks help with performance optimization, but they serve different purposes:

### useCallback

\`useCallback\` memoizes **functions** to prevent unnecessary re-renders of child components that receive functions as props.

\`\`\`jsx
const handleClick = useCallback(() => {
  console.log(count);
}, [count]);
\`\`\`

### useMemo

\`useMemo\` memoizes **values** to avoid expensive recalculations on every render.

\`\`\`jsx
const sortedList = useMemo(() => expensiveSort(items), [items]);
\`\`\`

### When to use which?

- Use **useCallback** when passing callbacks to optimized child components
- Use **useMemo** when you have computationally expensive calculations

### Performance Note

Don't overuse these hooks! They come with their own overhead.`,
    avatar: 'https://github.com/openai.png',
    name: 'AI Assistant',
  },
];

// ============================================================================
// SUGGESTIONS
// ============================================================================
export const suggestions = [
  'What are the latest trends in AI?',
  'How does machine learning work?',
  'Explain quantum computing',
  'Best practices for React development',
  'Tell me about TypeScript benefits',
  'How to optimize database queries?',
  'What is the difference between SQL and NoSQL?',
  'Explain cloud computing basics',
];

// ============================================================================
// MOCK RESPONSES
// ============================================================================
export const mockResponses = [
  "That's a great question! Let me help you understand this concept better. The key thing to remember is that proper implementation requires careful consideration of the underlying principles and best practices in the field.",
  "I'd be happy to explain this topic in detail. From my understanding, there are several important factors to consider when approaching this problem. Let me break it down step by step for you.",
  "This is an interesting topic that comes up frequently. The solution typically involves understanding the core concepts and applying them in the right context. Here's what I recommend...",
];
