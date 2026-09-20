import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import NotFound from './NotFound';

export function RouteErrorPage() {
  const error = useRouteError();

  // Check if it's a 404 error (RouteErrorResponse with status 404)
  if (isRouteErrorResponse(error) && error.status === 404) {
    return <NotFound />;
  }

  // Check if it's a runtime JS error (in development)
  const errorMessage = error instanceof Error ? error.message : String(error);
  const isDev = import.meta.env.DEV;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800">
      <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
      <p className="text-lg mb-8">An unexpected error occurred.</p>
      {isDev && (
        <details className="w-full max-w-md text-left bg-white p-4 rounded shadow-md">
          <summary className="font-semibold cursor-pointer">Error Details</summary>
          <pre className="mt-2 whitespace-pre-wrap overflow-auto max-h-64">{errorMessage}</pre>
        </details>
      )}
      <a href="/" className="mt-8 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        Go to Home
      </a>
    </div>
  );
}
