// @ts-check
import { luxass } from "@luxass/eslint-config";

export default await luxass({
  formatters: true,
  files: ["playground.ts"],
  rules: {
    "no-console": "off",
  },
});
