# ISSUES FEATURE MODULE

## OVERVIEW
Feature-sliced module handling issue creation, detail view, status transitions, comments, activity timeline, and drag-and-drop Kanban board layout.

## STRUCTURE
```
features/issues/
├── components/               # Issue UI components (IssueCard, BoardColumn, ActivityTimeline)
├── pages/                    # Issue pages (BoardPage, IssueDetailPage)
└── __tests__/                # Vitest React component tests
```

## WHERE TO LOOK
| Feature | File | Description |
|---------|------|-------------|
| Kanban Drag & Drop | `components/BoardColumn.tsx` | `@dnd-kit/core` & `@dnd-kit/sortable` integration |
| Issue Card Render | `components/IssueCard.tsx` | Draggable issue card display |
| Activity Log | `components/ActivityTimeline.tsx` | Render issue history & changes |
| Issue Modal / View | `components/IssueDetailView.tsx` | Full issue view dialog |

## CONVENTIONS
- Uses `@dnd-kit/core` (`DndContext`, `useDroppable`) and `@dnd-kit/sortable` (`SortableContext`, `useSortable`).
- Issue sorting keys are fractional indexing strings to maintain position without full re-indexing.
- Tests located in `__tests__/` directory using Vitest + `@testing-library/react`.
