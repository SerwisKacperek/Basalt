import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import { routes } from "~/routes";
import { ServiceProvider } from "~/services/ServiceContext";
import { createRegistry } from "~/services/createRegistry";

const router = createBrowserRouter(routes);
const registry = await createRegistry();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ServiceProvider value={registry}>
      <RouterProvider router={router} />
    </ServiceProvider>
  </StrictMode>
);
