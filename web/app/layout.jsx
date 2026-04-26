import './globals.css';

export const metadata = {
  title: 'Node It',
  description: 'Schema-driven hierarchical data, with merge-on-duplicate.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
