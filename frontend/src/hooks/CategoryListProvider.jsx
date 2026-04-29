import { useCallback, useEffect, useMemo, useState } from 'react';
import { Categories, readApiError } from '../services/api.js';
import { CategoryListContext } from './categoryListContext.js';

/**
 * Single source of truth for the category list. Both the left rail and the
 * canvas read from this provider; mutations from any consumer call refresh()
 * and every subscriber updates.
 */
export function CategoryListProvider({ children }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const data = await Categories.list();
      setList(data);
      setError(null);
      return data;
    } catch (err) {
      setError(readApiError(err, 'Failed to load categories'));
      throw err;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Categories.list()
      .then((data) => {
        if (!cancelled) {
          setList(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(readApiError(err, 'Failed to load categories'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({ list, error, refresh }),
    [list, error, refresh],
  );

  return (
    <CategoryListContext.Provider value={value}>
      {children}
    </CategoryListContext.Provider>
  );
}
