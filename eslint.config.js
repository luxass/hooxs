// @ts-check
import { luxass } from "@luxass/eslint-config";

export default await luxass({
  files: ["playground.ts"],
  rules: {
    "no-console": "off",
  },
});
