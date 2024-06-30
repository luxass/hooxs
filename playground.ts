import {
  createHooks,
} from "./src";

interface RuntimeHooks {
  "build:before": () => void;
  "build:after": (files: string[]) => void;
  "config:load"?: (config: Record<string, unknown>) => void;
}

const hooks = createHooks<RuntimeHooks>({
  "build:before": () => {
    console.info("build:before");
  },
  "build:after": (files: string[]) => {
    console.info("build:after", files);
  },
});

hooks.before((hook) => {
  console.info("this is running before", hook);
});

hooks.after((hook) => {
  console.info("this is running after", hook);
});

// a hook thats being registered after the initial hooks are created.
hooks.register("config:load", (config) => {
  console.info("config:load", config);
});

hooks.call("config:load", {
  foo: "bar",
  baz: "qux",
});

hooks.call("build:before");

const files = [
  "./src/index.ts",
  "./src/hooks.ts",
];
console.info("build complete");

hooks.call("build:after", files);
