import { describe, expect, it, vi } from "vitest";
import { createHooks } from "../src";

it("should return object of hook functions", () => {
  const hook = createHooks();

  expect(hook.hooks).toBeInstanceOf(Map);
  expect(hook.hooks.size).toBe(0);
  expect(hook.register).toBeInstanceOf(Function);
  expect(hook.call).toBeInstanceOf(Function);
  expect(hook.unregister).toBeInstanceOf(Function);
  expect(hook.unregisterAll).toBeInstanceOf(Function);
  expect(hook.before).toBeInstanceOf(Function);
});

it("should register hook", () => {
  const hook = createHooks();

  const hookFn = () => {};

  hook.register("build:before", hookFn);

  expect(hook.hooks.get("build:before")).toHaveLength(1);
  expect(hook.hooks.get("build:before")).toEqual([
    expect.any(Function),
  ]);

  hook.register("build:before", hookFn);

  expect(hook.hooks.get("build:before")).toHaveLength(2);
  expect(hook.hooks.get("build:before")).toEqual([
    expect.any(Function),
    expect.any(Function),
  ]);
});

it("should call hooks", () => {
  const hook = createHooks();
  const hookFn = vi.fn();

  hook.register("test:hook", hookFn);
  hook.call("test:hook");

  expect(hookFn).toHaveBeenCalled();
});

it("should unregister hook", () => {
  const hook = createHooks();
  const hookFn = vi.fn();

  hook.register("test:hook", hookFn);
  hook.unregister("test:hook", hookFn);

  expect(hook.hooks.get("test:hook")).toBeUndefined();
});

it("should unregister all hooks", () => {
  const hook = createHooks();
  const hookFn = vi.fn();

  hook.register("test:hook", hookFn);
  hook.register("test:hook2", hookFn);
  hook.unregisterAll();

  expect(hook.hooks.size).toBe(0);
});

it("should call before hooks", () => {
  const hook = createHooks();
  const beforeHookFn = vi.fn();

  hook.before(beforeHookFn);
  hook.call("test:hook");

  expect(beforeHookFn).toHaveBeenCalled();
});

it("should call after hooks", () => {
  const hook = createHooks();
  const afterHookFn = vi.fn();

  hook.after(afterHookFn);
  hook.call("test:hook");

  expect(afterHookFn).toHaveBeenCalled();
});

describe("should ignore hooks", () => {
  it("should ignore empty hook name", () => {
    const hooks = createHooks();
    hooks.register("", () => {});
    // @ts-expect-error - just for typescript to feel good.
    hooks.register(undefined, () => {});
    // @ts-expect-error - just for typescript to feel good.
    hooks.register(0, () => {});

    expect(hooks.hooks.get("")).toBeUndefined();
    // @ts-expect-error - just for typescript to feel good.ª
    expect(hooks.hooks.get(undefined)).toBeUndefined();

    // @ts-expect-error - just for typescript to feel good.
    expect(hooks.hooks.get(0)).toBeUndefined();
  });

  it("should ignore non-function hook", () => {
    const hooks = createHooks();
    hooks.register("test:hook", "");
    hooks.register("test:hook");
    hooks.register("test:hook", 0);

    expect(hooks.hooks.get("test:hook")).toBeUndefined();
  });
});
