import type { RouteObject } from "react-router";
import Root, { ErrorBoundary } from "~/root";
import Home from "~/routes/home";
import Test from "~/routes/test";
import Example from "~/routes/example";

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
      {
        path: "example",
        Component: Example,
      },
    ],
  },
];
