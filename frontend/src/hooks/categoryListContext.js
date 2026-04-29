import { createContext } from 'react';

// Split out so this file only exports a constant — keeps Fast Refresh happy
// when the provider component lives in its own .jsx.
export const CategoryListContext = createContext(null);
