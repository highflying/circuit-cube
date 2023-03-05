module.exports = {
  env: {
    es6: true,
    node: true,
  },
  globals: {
    Atomics: "readonly",
    SharedArrayBuffer: "readonly",
  },
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/explicit-function-return-type": "off",
    "object-literal-sort-keys": "off",
    // "variable-name": "warn",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/interface-name-prefix": "off",
    // VSC handles this
    "@typescript-eslint/no-unused-vars": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-empty-interface": "off",
    // allows use of require
    "@typescript-eslint/no-var-requires": "off",
    //   "@typescript-eslint/camelcase": "off",
    "@typescript-eslint/no-use-before-define": "off",
    //   "@typescript-eslint/prefer-interface": "off",
    // these are added just to get eslint passing for now
    // and they should be enabled
    //   "@typescript-eslint/explicit-member-accessibility": "off",
    //   "@typescript-eslint/no-non-null-assertion": "off",
    //   "@typescript-eslint/no-object-literal-type-assertion": "off",
    //   "@typescript-eslint/no-triple-slash-reference": "off",
    //   "@typescript-eslint/class-name-casing": "off",
    //   "@typescript-eslint/no-angle-bracket-type-assertion": "off"
  },
  parser: "@typescript-eslint/parser",
  extends: ["plugin:@typescript-eslint/recommended", "prettier"],
  plugins: ["@typescript-eslint", "prettier"],
};
