import type { HookFn, Hooks, Hooxs, InferHook, StringKey } from "./types.js";

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
    call(hook, ...args) {
      if (beforeHooks.size) {
        beforeHooks.forEach((fn) => fn(hook));
      }

      const hooks = registered.get(hook);

      if (hooks) {
        hooks.forEach((fn) => fn(...args));
      }

      if (afterHooks.size) {
        afterHooks.forEach((fn) => fn(hook));
      }
    },
    register(hook, fn) {
      if (!hook || typeof fn !== "function") {
        return () => {};
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
