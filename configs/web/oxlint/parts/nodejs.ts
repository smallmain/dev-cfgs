import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["node"],
  rules: {
    "node/no-new-require": "warn",
    "node/no-path-concat": "warn",
  },
});
