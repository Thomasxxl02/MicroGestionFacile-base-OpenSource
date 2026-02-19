import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'coverage',
      '.github',
      '**/*.config.js',
      '**/*.config.ts',
      'vite-env.d.ts',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, eslintConfigPrettier],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react/react-in-jsx-scope': 'off', // React 17+ JSX Transform
      'react/prop-types': 'off', // TypeScript remplace prop-types
      'react/no-unescaped-entities': 'warn',

      // TypeScript - Balance strictness and pragmatism
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-empty-interface': 'warn',

      // Best practices
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      eqeqeq: ['warn', 'smart'],
      'no-implicit-coercion': 'warn',
      'no-empty-function': ['warn', { allow: ['arrowFunctions'] }],
    },
  },
  // Allow 'any' in test files and mocks where it's more pragmatic
  {
    files: ['**/*.test.{ts,tsx}', '**/mocks/**', '**/fixtures/**', '**/setup.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  // Allow exports alongside components in test files
  {
    files: ['**/*.test.{ts,tsx}', '**/testWrappers.tsx', '**/usageExamples.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // Allow utility exports in context and type files
  {
    files: ['**/context/**/*.tsx', '**/types/**/*.ts', '**/services/**/*.ts'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // Relax `any` rules in services where type inference is complex
  {
    files: [
      '**/services/**/*.ts',
      '**/hooks/**/*.ts',
      '**/lib/**/*.ts',
      '**/types/**/*.ts',
      '**/context/**/*.tsx',
      '**/tests/utils/**/*.ts',
      '**/tests/e2e/**/*.ts',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  }
);
