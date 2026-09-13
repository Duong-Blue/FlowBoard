import { Link, useRouteError } from "react-router-dom";

export default function NotFound() {
  const error = useRouteError() as any;
  console.error(error);

  return (
    <div className="text-center py-20">
      <h1 className="text-4xl font-bold text-indigo-600 mb-4">404</h1>
      <p className="text-xl mb-8">Page Not Found</p>
      <p>Sorry, the page you are looking for does not exist.</p>
      <Link to="/" className="text-blue-500 hover:underline mt-8 inline-block">
        Go back to Home
      </Link>
    </div>
  );
}
