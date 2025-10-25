import type { HookFn, Hooks, Hooxs, InferHook, StringKey } from "../src";
import { describe, expectTypeOf, it } from "vitest";
import { createHooks } from "../src";

describe("type utilities", () => {
  describe("hookFn", () => {
    it("should accept functions with no arguments", () => {
      expectTypeOf<() => void>().toExtend<HookFn>();
      expectTypeOf<() => Promise<void>>().toExtend<HookFn>();
    });

    it("should accept functions with arguments", () => {
      expectTypeOf<(arg: string) => void>().toExtend<HookFn>();
      expectTypeOf<(arg1: string, arg2: number) => Promise<void>>().toExtend<HookFn>();
    });
  });

  describe("hooks", () => {
    it("should accept objects with string keys and HookFn values", () => {
      expectTypeOf<{ "build:before": () => void }>().toExtend<Hooks>();
      expectTypeOf<{ "test:hook": (arg: string) => Promise<void> }>().toExtend<Hooks>();
    });
  });

  describe("stringKey", () => {
    it("should preserve string literal types", () => {
      expectTypeOf<StringKey<"test">>().toEqualTypeOf<"test">();
    });

    it("should preserve string type", () => {
      expectTypeOf<StringKey<string>>().toEqualTypeOf<string>();
    });
  });

  describe("inferHook", () => {
    it("should infer correct hook function type", () => {
      interface TestHooks {
        "build:before": () => void;
        "build:after": (result: string) => Promise<void>;
      }

      expectTypeOf<InferHook<TestHooks, "build:before">>().toEqualTypeOf<() => void>();
      expectTypeOf<InferHook<TestHooks, "build:after">>().toEqualTypeOf<(result: string) => Promise<void>>();
    });
  });
});

describe("createHooks", () => {
  it("should return Hooxs interface", () => {
    const hooks = createHooks();
    expectTypeOf(hooks).toExtend<Hooxs<Record<string, never>>>();
  });

  it("should infer hook types from provided hooks object", () => {
    const hooks = createHooks({
      "build:before": () => { },
      "build:after": (_result: string) => { },
    });

    expectTypeOf(hooks).toExtend<Hooxs<{
      "build:before": () => void;
      "build:after": (result: string) => void;
    }>>();
  });

  it("should handle empty hooks object", () => {
    const hooks = createHooks({});
    expectTypeOf(hooks).toExtend<Hooxs<Record<string, never>>>();
  });

  it("should allow any hook name when called without arguments", () => {
    const hooks = createHooks();

    expectTypeOf(hooks.call).parameters.toExtend<[string, ...any[]]>();
    expectTypeOf(hooks.register).parameters.toExtend<[string, HookFn?]>();
  });

  it("should handle async hooks", () => {
    const hooks = createHooks({
      "async:hook": async (_value: number) => { },
    });

    expectTypeOf(hooks.call<"async:hook">).parameters.toEqualTypeOf<["async:hook", number]>();
    expectTypeOf(hooks.register<"async:hook">).parameters.toExtend<["async:hook", ((value: number) => Promise<void>)?]>();
  });

  it("should handle hooks with multiple parameters", () => {
    const hooks = createHooks({
      "multi:param": (_a: string, _b: number, _c: boolean) => { },
    });

    expectTypeOf(hooks.call<"multi:param">).parameters.toEqualTypeOf<["multi:param", string, number, boolean]>();
    expectTypeOf(hooks.register<"multi:param">).parameters.toExtend<["multi:param", ((a: string, b: number, c: boolean) => void)?]>();
  });
});

describe("hooxs interface", () => {
  describe("call", () => {
    it("should accept correct hook name and arguments", () => {
      const hooks = createHooks({
        "build:before": () => { },
        "build:after": (_result: string) => { },
      });

      expectTypeOf(hooks.call<"build:before">).parameters.toEqualTypeOf<["build:before"]>();
      expectTypeOf(hooks.call<"build:after">).parameters.toEqualTypeOf<["build:after", string]>();
    });
  });

  describe("register", () => {
    it("should accept correct hook name and function", () => {
      const hooks = createHooks({
        "build:before": () => { },
        "build:after": (_result: string) => { },
      });

      expectTypeOf(hooks.register<"build:before">).parameters.toExtend<["build:before", (() => void)?]>();
      expectTypeOf(hooks.register<"build:after">).parameters.toExtend<["build:after", ((result: string) => void)?]>();
    });

    it("should return unregister function", () => {
      const hooks = createHooks({
        "build:before": () => { },
      });

      const unregister = hooks.register("build:before", () => { });
      expectTypeOf(unregister).toEqualTypeOf<() => void>();
    });
  });

  describe("unregister", () => {
    it("should accept correct hook name and function", () => {
      const hooks = createHooks({
        "build:before": () => { },
        "build:after": (_result: string) => { },
      });

      expectTypeOf(hooks.unregister<"build:before">).parameters.toExtend<["build:before", (() => void)?]>();
      expectTypeOf(hooks.unregister<"build:after">).parameters.toExtend<["build:after", ((result: string) => void)?]>();
    });
  });

  describe("unregisterAll", () => {
    it("should return void", () => {
      const hooks = createHooks();
      expectTypeOf(hooks.unregisterAll).returns.toEqualTypeOf<void>();
    });
  });

  describe("before", () => {
    it("should accept function with hook name and return unregister function", () => {
      const hooks = createHooks({
        "build:before": () => { },
        "build:after": () => { },
      });

      expectTypeOf(hooks.before).parameters.toEqualTypeOf<[(hook: "build:before" | "build:after") => void]>();

      const unregister = hooks.before(() => { });
      expectTypeOf(unregister).toEqualTypeOf<() => void>();
    });
  });

  describe("after", () => {
    it("should accept function with hook name and return unregister function", () => {
      const hooks = createHooks({
        "build:before": () => { },
        "build:after": () => { },
      });

      expectTypeOf(hooks.after).parameters.toEqualTypeOf<[(hook: "build:before" | "build:after") => void]>();

      const unregister = hooks.after(() => { });
      expectTypeOf(unregister).toEqualTypeOf<() => void>();
    });
  });

  describe("hooks", () => {
    it("should be a Map with correct key-value types", () => {
      const hooks = createHooks({
        "build:before": () => { },
        "build:after": (_result: string) => { },
      });

      expectTypeOf(hooks.hooks).toEqualTypeOf<Map<"build:before" | "build:after", HookFn[]>>();
    });
  });
});
