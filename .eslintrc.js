module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    es2022: true
  },
  extends: [
    'eslint:recommended',
    'plugin:vue/recommended',
    'plugin:vuetify/base'
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  plugins: [
    'vue'
  ],
  rules: {
    'no-case-declarations': 'off',
    'no-return-await': 'off',
    'vue/no-use-v-if-with-v-for': ['error', {
      'allowUsingIterationVar': false
    }],
    'vue/multi-word-component-names': 0,
    'vue/require-v-for-key': 'off',
    'vue/no-v-html': 'off',
    'vue/require-prop-types': 'off',
    'vue/no-v-model-argument': 'off',
    'vue/require-default-prop': 'off',
    'no-return-assign': 'off',
    'vue/max-attributes-per-line': [
      'error',
      {
        'singleline': {
          'max': 10
        },
        'multiline': {
          'max': 10
        }
      }
    ],
    'vue/singleline-html-element-content-newline': 0,
    'no-empty': ['error', { 'allowEmptyCatch': true }],
    'indent': [
      'error',
      2,
      { 'SwitchCase': 1 }
    ],
    'linebreak-style': [
      'error',
      'unix'
    ],
    'quotes': [
      'error',
      'single'
    ],
    'semi': [
      'error',
      'never'
    ],
    'comma-dangle': [
      'error', 'never'
    ]
  },
  globals: {
    it: 'readonly',
    before: 'readonly',
    describe: 'readonly',
    Vue: 'readonly',
    window: 'readonly',
    screen: 'readonly'
  }
}
