# 📜 Project Rules & Conventions (Strict Mode)

## 1. Core Principles (Absolute Rules)

- **Maintenance First:** If a junior wouldn't understand it, rewrite it. Use comments to explain _why_, not _what_.
- **No Magic Numbers:** All constants must be declared in `src/constants` or at the top of the file.
- **Type Safety:** `any` type is strictly forbidden. Use `unknown` with type narrowing if absolutely necessary.
- **Component Colocation:** Related files (styles, tests, types, sub-components) stay together in the feature directory.

## 2. Tech Stack Standards

- **Framework:** Vite + React (Latest)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS (with `clsx` and `tailwind-merge` for conditional classes)
- **State:** Zustand (Store logic separated from UI components)
- **Date/Time:** Date-fns (Lightweight, immutable)
- **Package Manager:** pnpm (Strict dependency management)

## 3. Component Architecture

- **Server Components (Conceptual):** Even though this is a SPA (Vite), distinguish between "Smart Containers" (Logic) and "Dumb UI" (Presentational).
- **Naming Convention:** PascalCase for components (`UserProfile.tsx`), camelCase for hooks/functions (`useAuth.ts`).
- **Props Interface:** Always export the updated Props interface.
  ```typescript
  export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary";
  }
  ```

## 4. Git Convention (Conventional Commits)

- **feat:** New feature (e.g., `feat: implementation webcam capture logic`)
- **fix:** Bug fix (e.g., `fix: resolve canvas coordinate offset on mobile`)
- **refactor:** Code change that neither fixes a bug nor adds a feature
- **docs:** Documentation only changes
- **chore:** Build process or auxiliary tool changes
- **style:** Changes that do not affect the meaning of the code (white-space, formatting, etc)
- **test:** Adding missing tests or correcting existing tests

## 5. Directory Structure

```
src/
├── assets/          # Static assets
├── components/      # Shared components (Atomic design)
│   ├── ui/          # Generic UI (Buttons, Inputs) - Radix/Shadcn style
│   └── layout/      # Layout components (Sidebar, Header)
├── features/        # Feature-based modules
│   ├── id-photo/    # ID Photo logic & components
│   └── id-card/     # ID Card logic & components
├── hooks/           # Shared hooks
├── lib/             # Utility libraries (Dexie, Canvas helpers)
├── store/           # Global handling (Zustand)
├── types/           # Shared TypeScript interfaces
└── App.tsx
```

## 6. Testing Strategy

- **Unit Tests:** `vitest` for all utility functions (Canvas math, storage logic).
- **Component Tests:** `react-testing-library` for complex interactive components.
- **E2E/Integration:** `storywright` or standard `playwright` for critical flows (Webcam -> Edit -> Save).

## 7. Review Process

- Before marking a task as "Done", run `tsc` (Type check) and `lint`.
- Self-review: "Would I approve this PR if I were the lead engineer?"
