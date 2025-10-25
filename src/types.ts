/**
 * A hook function that can accept any arguments and return void or a Promise<void>
 */
export type HookFn = (...args: any[]) => Promise<void> | void;

/**
 * A collection of hook functions keyed by hook name
 */
export interface Hooks {
  [key: string]: HookFn;
}

/**
 * Utility type to ensure a value is a string key
 */
export type StringKey<T> = T & string;

/**
 * Infers the correct hook function type from a hooks collection
 */
export type InferHook<THooks, THook extends keyof THooks>
  = THooks[THook] extends HookFn
    ? THooks[THook]
    : THooks[THook] extends HookFn | undefined
      ? THooks[THook]
      : never;

/**
 * The main Hooxs interface for managing and calling hooks
 */
export interface Hooxs<THooks extends Hooks> {
  /**
   * Call a registered hook with the provided arguments
   */
  call: <THook extends keyof THooks>(
    hook: StringKey<THook>,
    ...args: Parameters<InferHook<THooks, THook>>
  ) => Promise<any>;

  /**
   * Register a hook function and return an unregister function
   */
  register: <THook extends keyof THooks>(
    hook: StringKey<THook>,
    fn?: InferHook<THooks, THook>,
  ) => () => void;

  /**
   * Unregister a specific hook function or all functions for a hook
   */
  unregister: <THook extends keyof THooks>(
    hook: StringKey<THook>,
    fn?: InferHook<THooks, THook>,
  ) => void;

  /**
   * Unregister all hooks
   */
  unregisterAll: () => void;

  /**
   * Register a function to run before any hook is called
   */
  before: (fn: (hook: keyof THooks) => void) => () => void;

  /**
   * Register a function to run after any hook is called
   */
  after: (fn: (hook: keyof THooks) => void) => () => void;

  /**
   * The internal map of registered hooks
   */
  hooks: ReadonlyMap<StringKey<keyof THooks>, HookFn[]>;
}
