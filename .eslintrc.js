module.exports = {
  root: true,
  env: {
    browser: true,
    'react-native/react-native': true,
  },
  extends: ['@react-native-community', 'airbnb-typescript', 'eslint:recommended', 'prettier', 'universe/native'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'prettier', 'import', 'react', 'react-hooks', 'react-native', 'jest'],
  rules: {
    '@typescript-eslint/naming-convention': ['error'],
    'ft-flow/boolean-style': [2, 'boolean'],
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    'no-undef': 2,
    'react/jsx-key': 2,
    'react/jsx-max-depth' : [2, { "max": 4 }],
    'react/jsx-no-bind': [
      0,
      {
        ignoreDOMComponents: false,
        ignoreRefs: false,
        allowArrowFunctions: true,
        allowFunctions: true,
        allowBind: true,
      },
    ],
    'react/jsx-no-comment-textnodes': 2,
    'react/jsx-no-duplicate-props': 2,
    'react/jsx-uses-react': 2,
    'react/jsx-uses-vars': 2,
    'react/no-children-prop': 2,
    'react/no-danger-with-children': 2,
    'react/no-deprecated': 2,
    'react/no-did-mount-set-state': 2,
    'react/no-direct-mutation-state': 2,
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'react-native/no-unused-styles': 2,
    'react-native/split-platform-components': 2,
    'react-native/no-inline-styles': 2,
    'react-native/no-color-literals': 2,
    'react-native/no-raw-text': [2,
      {
        skip: [
          "HeadingXLText",
          "HeadingLText",
          "HeadingSText",
          "HeadingXSText",
          "BodyText",
          "BodyBoldText",
          "BodyItalicText",
          "BodyBoldItalicText",
          "SmallText",
          "SmallBoldText",
          "SmallItalicText",
          "SmallBoldItalicText",
          "CaptionText",
          "CaptionBoldText",
          "CaptionItalicText",
          "CaptionBoldItalicText",
          "SmallInverseText",
          "SmallActionText",
          "NestedText",
          "NestedBoldText",
          "NestedItalicText",
          "NestedActionText",
        ]
      }
    ],
    'react-native/no-single-element-style-arrays': 2,
    'react-native/no-unused-styles': 2,
    'react/prop-types': 2,
    'semi': 2,
  },
  settings: {
    'ft-flow': {
      onlyFilesWithFlowAnnotation: false,
    },
    'import/extensions': ['.js', '.jsx', '.ts', '.tsx'],
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        directory: './tsconfig.json',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx'],
      },
    },
    'import/ignore': ['react-native'],
  },
};
