import { useContext } from 'react';
import { CategoryListContext } from './categoryListContext.js';

export function useCategoryList() {
  const ctx = useContext(CategoryListContext);
  if (!ctx) {
    throw new Error(
      'useCategoryList must be used inside <CategoryListProvider />',
    );
  }
  return ctx;
}
