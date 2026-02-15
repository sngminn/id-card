# 🧩 Skill: Component Creation (Strict)

## Description

Standard Operating Procedure for creating new React components.
Ensures consistency, accessibility, and type safety.

## Checklist

1. [ ] **File Location:** `src/components/{type}/{Name}.tsx` or `src/features/{feature}/{Name}.tsx`.
2. [ ] **Imports:**
   - React (`forwardRef` if applicable).
   - `clsx`, `tailwind-merge` for class handling.
   - Types from `@/types` if shared.
3. [ ] **Props Interface:**
   - Extend HTML attributes (e.g., `React.ButtonHTMLAttributes<HTMLButtonElement>`).
   - Use specific types, avoid `any`.
   - JSDoc comments for complex props.
4. [ ] **Component Structure:**
   - Named export (e.g., `export const Button = ...`).
   - Use `forwardRef` to allow parent access to DOM node.
   - Destructure props for cleanliness.
5. [ ] **Styling:**
   - Use `cn()` utility (clsx + tailwind-merge) for `className` prop.
   - Handling conditional styles logically.
6. [ ] **Accessibility (A11y):**
   - Ensure interactive elements have keyboard support.
   - ARIA labels if visual context is missing.

## Template

```typescript
import { forwardRef } from 'react';
import { cn } from '@/lib/utils'; // Assuming this utility exists

export interface MyComponentProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outline';
  label: string;
}

export const MyComponent = forwardRef<HTMLDivElement, MyComponentProps>(
  ({ className, variant = 'default', label, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'base-styles',
          variant === 'default' && 'bg-primary text-white',
          variant === 'outline' && 'border border-input',
          className
        )}
        {...props}
      >
        <span className="sr-only">{label}</span>
        {label}
      </div>
    );
  }
);

MyComponent.displayName = 'MyComponent';
```
