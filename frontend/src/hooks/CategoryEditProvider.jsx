import { useCallback, useMemo, useState } from 'react';
import CategoryEditModal from '../components/category/CategoryEditModal.jsx';
import { CategoryEditContext } from './categoryEditContext.js';

/**
 * One modal instance, mounted once at the layout level. Any consumer (rail
 * row, canvas selection bar, detail page header) calls `open(category)` and
 * the modal slides in over the current view. Replaces the old inline edit
 * form so /categories/:id stops being a giant editor surface.
 */
export function CategoryEditProvider({ children }) {
  const [editing, setEditing] = useState(null);

  const open = useCallback((category) => setEditing(category), []);
  const close = useCallback(() => setEditing(null), []);

  const value = useMemo(() => ({ open, close }), [open, close]);

  return (
    <CategoryEditContext.Provider value={value}>
      {children}
      {editing && <CategoryEditModal category={editing} onClose={close} />}
    </CategoryEditContext.Provider>
  );
}
