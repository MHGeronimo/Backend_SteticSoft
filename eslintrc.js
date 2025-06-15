module.exports = {
  env: {
    commonjs: true,
    es2021: true,
    node: true,
  },
  extends: [
    'standard', // Using eslint-config-standard
    'plugin:prettier/recommended', // Integrates Prettier with ESLint
  ],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    'prettier/prettier': 'error', // Report Prettier violations as ESLint errors
    // Add any project-specific rules here
    // Example:
    // 'no-unused-vars': ['warn', { 'argsIgnorePattern': '^_' }],
  },
};
