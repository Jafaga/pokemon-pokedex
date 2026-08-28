import React from "react";
import { createRoot } from "react-dom/client";
import Pokedex from "../../app/page";
import "../../app/globals.css";

// Vercel serves a client-only Vite build, but reuses the exact same Pokédex
// component and styles as the Sites build to keep both published versions equal.
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Pokedex />
  </React.StrictMode>,
);
