import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: [
    {
      name: "security",
      specifier: "eslint-plugin-security",
    },
  ],
  rules: {
    "security/detect-bidi-characters": "error",
    "security/detect-buffer-noassert": "error",
    "security/detect-child-process": "error",
    "security/detect-disable-mustache-escape": "error",
    "security/detect-eval-with-expression": "error",
    "security/detect-new-buffer": "error",
    "security/detect-no-csrf-before-method-override": "error",
    "security/detect-non-literal-require": "error",
    "security/detect-possible-timing-attacks": "error",
    "security/detect-pseudoRandomBytes": "error",
    "security/detect-unsafe-regex": "error",

    // the following rules are valuable for security, but are commonly found in legitimate code paths.
    "security/detect-non-literal-fs-filename": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-object-injection": "warn",
  },
});
