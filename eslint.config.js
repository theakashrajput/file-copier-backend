import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier'; // 1. Import this

/** @type {import('eslint').Linter.Config[]} */
export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: globals.node,
    },
  },

  {
    ignores: [
      'node_modules/**',
      'dist/**',
      '.env',
      '.env.local',
      '.env.example',
    ],
  },

  eslintConfigPrettier,
];
