import { ESLint } from "eslint";

describe("Global ESLint compliance", () => {
  test("no react-hooks/rules-of-hooks violations in src", async () => {
    const eslint = new ESLint({
      useEslintrc: false,
      overrideConfig: {
        parserOptions: {
          ecmaVersion: 2020,
          sourceType: "module",
          ecmaFeatures: { jsx: true },
        },
        env: { browser: true, es2021: true },
        plugins: ["react-hooks"],
        rules: { "react-hooks/rules-of-hooks": "error" },
      },
    });
    const results = await eslint.lintFiles(["src/**/*.js"]);
    const violations = [];
    results.forEach((r) => {
      r.messages.forEach((m) => {
        if (m.ruleId === "react-hooks/rules-of-hooks" && m.severity === 2)
          violations.push({ file: r.filePath, ...m });
      });
    });
    if (violations.length) {
      const formatted = violations
        .map((v) => `${v.file}:${v.line}:${v.column} ${v.message}`)
        .join("\n");
      throw new Error("react-hooks/rules-of-hooks violations:\n" + formatted);
    }
    expect(violations.length).toBe(0);
  });
});
