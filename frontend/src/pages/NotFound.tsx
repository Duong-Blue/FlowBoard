import { Link, useRouteError } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "../components/ui/button";

export default function NotFound() {
  const error = useRouteError() as any;
  console.error(error);

  useEffect(() => {
    document.title = "404 - Not Found";
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 p-4 text-center">
      <h1 className="text-6xl font-bold text-slate-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-slate-700 mb-2">Page Not Found</h2>
      <p className="text-slate-500 max-w-md mb-8">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Button asChild>
        <Link to="/">Return Home</Link>
      </Button>
    </div>
  );
}
