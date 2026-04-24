// Shorthand fixtures used across integration tests. Kept minimal on purpose —
// tests that need variants should extend these inline.

export const groceriesCategoryFixture = {
  name: 'Groceries',
  description: 'Shopping list with quantities and price',
  fields: [
    { key: 'name', label: 'Item', type: 'text' },
    { key: 'qty', label: 'Qty', type: 'number', aggregate: 'sum' },
    { key: 'price', label: 'Price', type: 'currency' },
  ],
  identityKeys: ['name'],
};

export const expensesCategoryFixture = {
  name: 'Expenses',
  fields: [
    { key: 'label', label: 'Label', type: 'text' },
    { key: 'amount', label: 'Amount', type: 'currency', aggregate: 'sum' },
    { key: 'rating', label: 'Rating', type: 'number', aggregate: 'avg' },
  ],
  identityKeys: [],
};

export const notesCategoryFixture = {
  name: 'Notes',
  fields: [
    { key: 'title', label: 'Title', type: 'text' },
    { key: 'body', label: 'Body', type: 'text' },
  ],
  identityKeys: [],
};
