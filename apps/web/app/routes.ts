import type { RouteObject } from "react-router";
import Root, { ErrorBoundary } from "~/root";
import Test from "~/routes/test";
import Example from "~/routes/example";
import EditorList from "~/routes/editor-list";
import Editor from "~/routes/editor";
import Main from "~/routes/main";


export const routes: RouteObject[] = [
  {
    path: "/",
    Component: Root,
    ErrorBoundary,
    children: [
      {
        index: true,
        Component: Main,
      },
      {
        path: "test",
        Component: Test,
      },
      {
        path: "example",
        Component: Example,
      },
      {
        path: "editor",
        Component: EditorList,
      },
      {
        path: "editor/:id",
        Component: Editor,
      },
    ],
  },
];
