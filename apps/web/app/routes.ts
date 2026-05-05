import type { RouteObject } from "react-router";
import Root, { ErrorBoundary } from "~/root";
import Home from "~/routes/home";

export const routes: RouteObject[] = [
  {
    path: "/",
    Component: Root,
    ErrorBoundary,
    children: [
      {
        index: true,
        Component: Home,
      },
    ],
  },
];
