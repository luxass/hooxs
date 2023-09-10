import { beforeEach, describe, expect, test, vi } from "vitest";
import { createHooks } from "../src";

let noop = () => {};

beforeEach(() => {
  noop = vi.fn();
});

test("should return object of hook functions", () => {
  const hook = createHooks();

  expect(hook.hooks).toBeInstanceOf(Map);
  expect(hook.hooks.size).toBe(0);
  expect(hook.register).toBeInstanceOf(Function);
  expect(hook.call).toBeInstanceOf(Function);
  expect(hook.unregister).toBeInstanceOf(Function);
  expect(hook.unregisterAll).toBeInstanceOf(Function);
  expect(hook.before).toBeInstanceOf(Function);
});

test("should register hook", () => {
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

describe("should ignore hooks", () => {
  test("should ignore empty hook name", () => {
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

  test("should ignore non-function hook", () => {
    const hooks = createHooks();
    hooks.register("test:hook", "");
    hooks.register("test:hook");
    hooks.register("test:hook", 0);

    expect(hooks.hooks.get("test:hook")).toBeUndefined();
  });
});
