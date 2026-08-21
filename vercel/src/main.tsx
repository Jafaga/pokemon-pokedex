import React from "react";
import { createRoot } from "react-dom/client";
import Pokedex from "../../app/page";
import "../../app/globals.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Pokedex />
  </React.StrictMode>,
);
