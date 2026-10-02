import React from "react";
import { createRoot } from "react-dom/client";
import { FacebookLiteApp } from "./lite/App";
import "./styles.css";
createRoot(document.getElementById("root")!).render(<React.StrictMode><FacebookLiteApp/></React.StrictMode>);
