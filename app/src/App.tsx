import { lazy } from "react";

const Micro = lazy(() => import("@example/micro"));

export const App = () => {
  return (
    <div>
      <h1>This is the main application</h1>
      <hr />
      <h2>This is the micro frontend</h2>
      <Micro />
    </div>
  );
};
