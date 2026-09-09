export default [
  {
    ignores: ["node_modules", "dist"]
  },
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        document: "readonly",
        navigator: "readonly",
        window: "readonly",
        console: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        Promise: "readonly",
        URL: "readonly",
        File: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        alert: "readonly",
        fetch: "readonly",
        Math: "readonly",
        Date: "readonly",
        URLSearchParams: "readonly"
      }
    },
    rules: {
      "no-undef": "error"
    }
  }
];
