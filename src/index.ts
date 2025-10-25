import type { HookFn, Hooks, Hooxs, InferHook, StringKey } from "./types";

export type {
  HookFn,
  Hooks,
  Hooxs,
  InferHook,
  StringKey,
};

export function createHooks<THooks extends Record<string, any>>(hooks?: THooks): Hooxs<THooks> {
  const registered: Map<string, HookFn[]> = new Map();

  if (hooks) {
    Object.keys(hooks).forEach((hook) => {
      registered.set(hook, [hooks[hook]]);
    });
  }

  const beforeHooks: Set<HookFn> = new Set();
  const afterHooks: Set<HookFn> = new Set();

  return {
    async call(hook, ...args) {
      if (beforeHooks.size) {
        beforeHooks.forEach((fn) => fn(hook));
      }

      // get registered hooks for this event
      const hooks = registered.get(hook as string);
      if (!hooks || hooks.length === 0) {
        // no hooks to run, just run after hooks
        if (afterHooks.size) {
          afterHooks.forEach((fn) => fn(hook));
        }

        return Promise.resolve();
      }

      // create task for Chrome DevTools debugging
      // https://developer.chrome.com/blog/devtools-modern-web-debugging/#linked-stack-traces
      // @ts-expect-error - console.createTask is a Chrome-only feature
      // eslint-disable-next-line no-console
      const task = typeof console !== "undefined" && console.createTask !== undefined
        // @ts-expect-error - console.createTask is a Chrome-only feature
        // eslint-disable-next-line no-console
        ? console.createTask(hook as string)
        : { run: (fn: () => any) => fn() };

      // execute hooks serially using reduce
      const result = hooks.reduce(
        (promise, hookFn) =>
          promise.then(() => task.run(() => hookFn(...args))),
        Promise.resolve(),
      );

      // run after hooks when done
      try {
        return await result;
      } finally {
        if (afterHooks.size) {
          afterHooks.forEach((fn) => fn(hook));
        }
      }
    },
    register(hook, fn) {
      if (!hook || typeof fn !== "function") {
        return () => { };
      }

      const hooks = registered.get(hook);
      if (hooks) {
        hooks.push(fn);
      } else {
        registered.set(hook, [fn]);
      }
      return () => {
        return this.unregister(hook, fn);
      };
    },
    unregister(hook, fn) {
      const hooks = registered.get(hook);

      if (!hooks) return;

      if (!fn) {
        registered.delete(hook);
        return;
      }

      const specificHook = hooks.find((h) => h === fn);
      if (specificHook) {
        hooks.splice(hooks.indexOf(specificHook), 1);
        if (hooks.length === 0) {
          registered.delete(hook);
        }
      }
    },
    unregisterAll() {
      registered.clear();
    },
    before(hookFn) {
      beforeHooks.add(hookFn);

      return () => {
        beforeHooks.delete(hookFn);
      };
    },
    after(hookFn) {
      afterHooks.add(hookFn);

      return () => {
        afterHooks.delete(hookFn);
      };
    },
    hooks: registered,
  };
}
