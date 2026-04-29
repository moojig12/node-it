import { useContext } from 'react';
import { CategoryEditContext } from './categoryEditContext.js';

export function useCategoryEdit() {
  const ctx = useContext(CategoryEditContext);
  if (!ctx) {
    throw new Error(
      'useCategoryEdit must be used inside <CategoryEditProvider />',
    );
  }
  return ctx;
}
