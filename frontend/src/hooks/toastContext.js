import { createContext } from 'react';

// Shared context object. Split from the provider file so React Fast Refresh
// is happy (a single module must export either only components or only
// non-components).
export const ToastContext = createContext(null);
