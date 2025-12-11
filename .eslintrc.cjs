module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true
  },
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: "module"
  },
  ignorePatterns: [
    "node_modules",
    "dist",
    "build",
    "out",
    ".next"
  ]
  // Später hängen wir hier unsere eigene Config aus packages/eslint-config dran.
};
