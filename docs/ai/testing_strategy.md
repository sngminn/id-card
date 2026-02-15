# 🧪 Testing Strategy

## 1. Unit Testing (Vitest)

Target: Pure logic functions, data transformations, and hooks.

- **Stack:** `vitest`, `@testing-library/react-hooks`
- **Scope:**
  - `src/lib/canvas.ts`: Coordinate calculations, aspect ratio math.
  - `src/lib/storage.ts`: Dexie database CRUD operations.
  - `src/utils/image.ts`: Compression logic, file validation.

## 2. Component Testing (Vitest + React Testing Library)

Target: Reusable UI components and isolated feature components.

- **Scope:**
  - `components/ui/*`: Buttons, Sliders, Modals (ensure accessibility props work).
  - `features/id-photo/WebcamView`: Ensure fallback UI renders when camera is denied.

## 3. Visual & Integration Testing (Storybook + Storywright)

Target: Visual regression and user flows.

- **Why Storybook?**
  - Isolating complex canvas components (`ImageEditor`) often requires visual inspection.
  - developing "hard-to-reach" states (e.g., error states, loading states) in isolation.
- **Why Storywright?**
  - Automating screenshots of Storybook stories to catch UI regressions.
  - Validating "Grid Layout" behavior with different numbers of items.

## 4. Manual Verification Checklist

Before any major release/merge:

1. [ ] **Privacy Check:** Turn off WiFi and ensure the app works 100% offline.
2. [ ] **Performance:** Test with a 10MB+ high-res photo. UI should not freeze for > 1s.
3. [ ] **Mobile Touch:** Verify crop gestures (pinch zoom) work on mobile simulation.
