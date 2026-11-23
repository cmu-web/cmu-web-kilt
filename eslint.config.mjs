import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/",
      "packages/rails/js/",
      "packages/rails/pkg/",
      "packages/python/src/cmu_web_kilt/static/",
      "packages/python/dist/",
    ],
  },
  js.configs.recommended,
  {
    // The kit's script and the docs' script run in the browser, as classic
    // scripts alongside the template's jQuery
    files: ["js/**/*.js", "docs/js/**/*.js"],
    languageOptions: { sourceType: "script", globals: globals.browser },
  },
  {
    // Command-line tools and this configuration run in Node
    files: ["tools/**/*.mjs", "bin/**/*.mjs", "eslint.config.mjs"],
    languageOptions: { sourceType: "module", globals: globals.node },
  },
];
