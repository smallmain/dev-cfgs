import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: [
    {
      name: "e18e",
      specifier: "@e18e/eslint-plugin",
    },
  ],
  rules: {
    // FIXME: code is commented out because oxlint does not support json rules yet.
    // "e18e/ban-dependencies": "error",
  },
});
