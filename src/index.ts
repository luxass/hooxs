export type HookFn = (...args: any) => Promise<void> | void;

export interface Hooks {
  [key: string]: HookFn
}

type StringKey<T> = T & string;

export type InferHook<THooks, THook extends keyof THooks> = THooks[THook] extends HookFn
  ? THooks[THook]
  : THooks[THook] extends HookFn | undefined ? THooks[THook] : never;

export interface Hooxs<THooks extends Hooks> {
  call<THook extends keyof THooks>(hook: StringKey<THook>, ...args: Parameters<InferHook<THooks, THook>>): void
  register<THook extends keyof THooks>(hook: StringKey<THook>, fn?: InferHook<THooks, THook>): () => void
  unregister<THook extends keyof THooks>(hook: StringKey<THook>, fn?: InferHook<THooks, THook>): void
  unregisterAll(): void
  before: (fn: (hook: keyof THooks) => void) => () => void
  after: (fn: (hook: keyof THooks) => void) => () => void

  hooks: Map<keyof THooks, HookFn[]>
}

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
      }
    },
    unregisterAll() {

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
