import { createContext } from 'react';

// Lives in its own file so this module exports a constant only — keeps
// Fast Refresh happy while the provider component sits in a .jsx file.
export const CategoryEditContext = createContext(null);
