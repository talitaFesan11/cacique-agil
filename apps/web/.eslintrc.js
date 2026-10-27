module.exports = {
  extends: ['next/core-web-vitals', '@fluxo/eslint-config'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
  },
};
