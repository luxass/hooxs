export type HookFn = (...args: any) => Promise<void> | void;

export interface Hooks {
  [key: string]: HookFn
}

export type InferHook<THooks, THook extends keyof THooks> = THooks[THook] extends HookFn
  ? THooks[THook]
  : THooks[THook] extends HookFn | undefined ? THooks[THook] : never;

export interface Hooxs<THooks extends Hooks> {
  call<THook extends keyof THooks>(hook: THook, ...args: Parameters<InferHook<THooks, THook>>): void
  register<THook extends keyof THooks>(hook: THook, fn: InferHook<THooks, THook>): () => void
  unregister(hook: keyof THooks, fn: any): void
  unregisterAll(hook: keyof THooks): void
  before: (fn: (hook: keyof THooks) => void) => () => void
  after: (fn: (hook: keyof THooks) => void) => () => void

  hooks: Map<keyof THooks, HookFn[]>
}

export function createHooks<THooks extends Record<string, any> = Record<string, HookFn>>(hooks?: THooks): Hooxs<THooks> {
  const registered: Map<string, HookFn[]> = new Map();

  if (hooks) {
    Object.keys(hooks).forEach((hook) => {
      registered.set(hook, [hooks[hook]]);
    });
  }

  const beforeHooks: ((hook: keyof THooks) => void)[] = [];
  const afterHooks: ((hook: keyof THooks) => void)[] = [];

  return {
    call(hook, ...args) {
      if (beforeHooks.length) {
        beforeHooks.forEach((fn) => fn(hook));
      }

      if (afterHooks.length) {
        afterHooks.forEach((fn) => fn(hook));
      }

      const hooks = registered.get(hook);

      if (hooks) {
        hooks.forEach((fn) => fn(...args));
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
      if (hooks) {
        const index = hooks.indexOf(fn);
        if (index !== -1) {
          hooks.splice(index, 1);
        }
      }
    },
    unregisterAll(hook) {
      registered.delete(hook);
    },
    before(hookFn) {
      beforeHooks.push(hookFn);

      return () => {
        const index = beforeHooks.indexOf(hookFn);
        if (index !== -1) {
          beforeHooks.splice(index, 1);
        }
      };
    },
    after(hookFn) {
      afterHooks.push(hookFn);

      return () => {
        const index = afterHooks.indexOf(hookFn);
        if (index !== -1) {
          afterHooks.splice(index, 1);
        }
      };
    },
    hooks: registered,
  };
}
