'use client';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <main style={{ padding: 48, textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h1>Something went wrong</h1>
          <p>Please reload the page.</p>
          <button type="button" onClick={reset} style={{ marginTop: 16, padding: '8px 20px', cursor: 'pointer' }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
