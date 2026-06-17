import { defineConfig } from "oxlint";
import react from "./react.js";

export default defineConfig({
  extends: [react],
  plugins: ["nextjs"],
  rules: {},
});
