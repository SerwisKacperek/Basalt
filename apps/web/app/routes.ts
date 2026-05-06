import type { RouteObject } from "react-router";
import Root, { ErrorBoundary } from "~/root";
import Home from "~/routes/home";
import Test from "~/routes/test";

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
      {
        path: "test",
        Component: Test,
      },
    ],
  },
];
