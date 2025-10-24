import { describe, expect, it, vi } from "vitest";
import { createHooks } from "../src";

describe("hooxs", () => {
  describe("basic hook flow", () => {
    it("should execute a simple hook when called", async () => {
      const hooks = createHooks();
      const myHook = vi.fn();

      hooks.register("app:start", myHook);
      await hooks.call("app:start");

      expect(myHook).toHaveBeenCalledTimes(1);
    });

    it("should pass data through hooks", async () => {
      const hooks = createHooks();
      const buildHook = vi.fn();

      hooks.register("build:done", buildHook);
      await hooks.call("build:done", { files: 10, size: "2mb" });

      expect(buildHook).toHaveBeenCalledWith({ files: 10, size: "2mb" });
    });

    it("should execute multiple hooks in registration order", async () => {
      const hooks = createHooks();
      const results: string[] = [];

      hooks.register("plugin:load", () => results.push("plugin-a"));
      hooks.register("plugin:load", () => results.push("plugin-b"));
      hooks.register("plugin:load", () => results.push("plugin-c"));

      await hooks.call("plugin:load");

      expect(results).toEqual(["plugin-a", "plugin-b", "plugin-c"]);
    });
  });

  describe("lifecycle simulation", () => {
    it("should handle a complete build lifecycle", async () => {
      const hooks = createHooks();
      const lifecycle: string[] = [];

      hooks.before((hookName) => lifecycle.push(`before:${String(hookName)}`));
      hooks.after((hookName) => lifecycle.push(`after:${String(hookName)}`));

      hooks.register("build:start", () => lifecycle.push("building"));
      hooks.register("build:done", () => lifecycle.push("done"));

      await hooks.call("build:start");
      await hooks.call("build:done");

      expect(lifecycle).toEqual([
        "before:build:start",
        "building",
        "after:build:start",
        "before:build:done",
        "done",
        "after:build:done",
      ]);
    });

    it("should handle plugin system with multiple plugins", async () => {
      const hooks = createHooks();
      const pluginA = { name: "A", calls: 0 };
      const pluginB = { name: "B", calls: 0 };

      hooks.register("init", () => pluginA.calls++);
      hooks.register("init", () => pluginB.calls++);

      await hooks.call("init");

      expect(pluginA.calls).toBe(1);
      expect(pluginB.calls).toBe(1);
    });

    it("should allow plugins to process data in sequence", async () => {
      const hooks = createHooks();
      let content = "hello";

      hooks.register("transform", () => {
        content = content.toUpperCase();
      });
      hooks.register("transform", () => {
        content = `${content}!`;
      });

      await hooks.call("transform");

      expect(content).toBe("HELLO!");
    });
  });

  describe("hook management", () => {
    it("should allow cleanup via returned unregister function", async () => {
      const hooks = createHooks();
      const tempHook = vi.fn();

      const unregister = hooks.register("temp:event", tempHook);

      await hooks.call("temp:event");
      expect(tempHook).toHaveBeenCalledTimes(1);

      unregister();
      await hooks.call("temp:event");
      expect(tempHook).toHaveBeenCalledTimes(1);
    });

    it("should support selective hook removal", async () => {
      const hooks = createHooks();
      const keepHook = vi.fn();
      const removeHook = vi.fn();

      hooks.register("event", keepHook);
      hooks.register("event", removeHook);

      await hooks.call("event");
      expect(keepHook).toHaveBeenCalledTimes(1);
      expect(removeHook).toHaveBeenCalledTimes(1);

      hooks.unregister("event", removeHook);

      await hooks.call("event");
      expect(keepHook).toHaveBeenCalledTimes(2);
      expect(removeHook).toHaveBeenCalledTimes(1);
    });

    it("should allow clearing all event hooks at once", async () => {
      const hooks = createHooks();
      const hook1 = vi.fn();
      const hook2 = vi.fn();

      hooks.register("event", hook1);
      hooks.register("event", hook2);

      hooks.unregister("event");
      await hooks.call("event");

      expect(hook1).not.toHaveBeenCalled();
      expect(hook2).not.toHaveBeenCalled();
    });

    it("should reset entire hook system", async () => {
      const hooks = createHooks();
      const hook1 = vi.fn();
      const hook2 = vi.fn();

      hooks.register("event1", hook1);
      hooks.register("event2", hook2);

      hooks.unregisterAll();

      await hooks.call("event1");
      await hooks.call("event2");

      expect(hook1).not.toHaveBeenCalled();
      expect(hook2).not.toHaveBeenCalled();
    });
  });

  describe("lifecycle interceptors", () => {
    it("should notify before any hook executes", async () => {
      const hooks = createHooks();
      const beforeSpy = vi.fn();
      const mainHook = vi.fn();

      hooks.before(beforeSpy);
      hooks.register("action", mainHook);

      await hooks.call("action");

      expect(beforeSpy).toHaveBeenCalledWith("action");
      expect(beforeSpy).toHaveBeenCalledBefore(mainHook);
    });

    it("should notify after any hook executes", async () => {
      const hooks = createHooks();
      const afterSpy = vi.fn();
      const mainHook = vi.fn();

      hooks.after(afterSpy);
      hooks.register("action", mainHook);

      await hooks.call("action");

      expect(afterSpy).toHaveBeenCalledWith("action");
      expect(mainHook).toHaveBeenCalledBefore(afterSpy);
    });

    it("should allow monitoring all hook activity", async () => {
      const hooks = createHooks();
      const activity: string[] = [];

      hooks.before((name) => activity.push(`>${String(name)}`));
      hooks.after((name) => activity.push(`<${String(name)}`));

      hooks.register("a", () => {});
      hooks.register("b", () => {});

      await hooks.call("a");
      await hooks.call("b");
      await hooks.call("a");

      expect(activity).toEqual([">a", "<a", ">b", "<b", ">a", "<a"]);
    });

    it("should support cleanup of lifecycle interceptors", async () => {
      const hooks = createHooks();
      const beforeHook = vi.fn();

      const cleanup = hooks.before(beforeHook);

      await hooks.call("event");
      expect(beforeHook).toHaveBeenCalledTimes(1);

      cleanup();
      await hooks.call("event");
      expect(beforeHook).toHaveBeenCalledTimes(1);
    });
  });

  describe("async hook handling", () => {
    it("should work with async hook functions", async () => {
      const hooks = createHooks();
      const results: string[] = [];

      hooks.register("fetch:data", async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        results.push("data-fetched");
      });

      hooks.call("fetch:data");

      await new Promise((resolve) => setTimeout(resolve, 20));
      expect(results).toContain("data-fetched");
    });

    it("should handle mix of sync and async hooks", async () => {
      const hooks = createHooks();
      const order: string[] = [];

      hooks.register("process", () => order.push("sync-1"));
      hooks.register("process", async () => {
        await Promise.resolve();
        order.push("async");
      });

      hooks.register("process", () => order.push("sync-2"));

      hooks.call("process");

      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(order).toEqual(["sync-1", "async", "sync-2"]);
    });
  });

  describe("pre-initialized hooks", () => {
    it("should start with hooks already registered", async () => {
      const initHook = vi.fn();

      const hooks = createHooks({
        "app:init": initHook,
      });

      await hooks.call("app:init");

      expect(initHook).toHaveBeenCalledTimes(1);
    });

    it("should allow adding more hooks to pre-initialized events", async () => {
      const initial = vi.fn();
      const additional = vi.fn();

      const hooks = createHooks({
        event: initial,
      });

      hooks.register("event", additional);
      await hooks.call("event");

      expect(initial).toHaveBeenCalledTimes(1);
      expect(additional).toHaveBeenCalledTimes(1);
    });
  });

  describe("practical scenarios", () => {
    it("should implement a simple middleware pattern", async () => {
      const hooks = createHooks();
      const log: string[] = [];

      hooks.register("request", () => log.push("auth"));
      hooks.register("request", () => log.push("validation"));
      hooks.register("request", () => log.push("processing"));
      hooks.register("request", () => log.push("response"));

      await hooks.call("request");

      expect(log).toEqual(["auth", "validation", "processing", "response"]);
    });

    it("should support error handling in hooks", async () => {
      const hooks = createHooks();

      hooks.register("risky:operation", () => {
        throw new Error("Something went wrong");
      });

      await expect(hooks.call("risky:operation")).rejects.toThrow("Something went wrong");
    });

    it("should allow building a notification system", async () => {
      const hooks = createHooks();
      const notifications: Array<{ type: string; message: string }> = [];

      hooks.register("notify:info", (msg: string) =>
        notifications.push({ type: "info", message: msg }));
      hooks.register("notify:error", (msg: string) =>
        notifications.push({ type: "error", message: msg }));

      await hooks.call("notify:info", "User logged in");
      await hooks.call("notify:error", "Failed to save");

      expect(notifications).toEqual([
        { type: "info", message: "User logged in" },
        { type: "error", message: "Failed to save" },
      ]);
    });

    it("should enable feature flag system", async () => {
      const hooks = createHooks();
      const features = { analytics: false, beta: false };

      hooks.register("feature:enable", (name: string) => {
        if (name === "analytics") features.analytics = true;
        if (name === "beta") features.beta = true;
      });

      await hooks.call("feature:enable", "analytics");

      expect(features.analytics).toBe(true);
      expect(features.beta).toBe(false);
    });

    it("should coordinate multiple subsystems", async () => {
      const hooks = createHooks();
      const state = { db: false, cache: false, server: false };

      hooks.register("system:start", () => {
        state.db = true;
      });
      hooks.register("system:start", () => {
        state.cache = true;
      });
      hooks.register("system:start", () => {
        state.server = true;
      });

      await hooks.call("system:start");

      expect(state).toEqual({ db: true, cache: true, server: true });
    });
  });

  describe("edge cases and robustness", () => {
    it("should handle calling non-existent hooks gracefully", async () => {
      const hooks = createHooks();

      await expect(hooks.call("doesnt:exist")).resolves.not.toThrow();
    });

    it("should continue executing hooks even if before/after are not registered", async () => {
      const hooks = createHooks();
      const mainHook = vi.fn();

      hooks.register("event", mainHook);
      await hooks.call("event");

      expect(mainHook).toHaveBeenCalledTimes(1);
    });

    it("should handle same function registered multiple times", async () => {
      const hooks = createHooks();
      const sameFunc = vi.fn();

      hooks.register("event", sameFunc);
      hooks.register("event", sameFunc);
      hooks.register("event", sameFunc);

      await hooks.call("event");

      expect(sameFunc).toHaveBeenCalledTimes(3);
    });

    it("should work with complex data structures", async () => {
      const hooks = createHooks();
      const dataHook = vi.fn();

      const complexData = {
        user: { id: 1, name: "test" },
        metadata: { timestamp: Date.now() },
        items: [1, 2, 3],
      };

      hooks.register("data:process", dataHook);
      await hooks.call("data:process", complexData);

      expect(dataHook).toHaveBeenCalledWith(complexData);
    });

    it("should handle multiple arguments in hook calls", async () => {
      const hooks = createHooks();
      const multiArgHook = vi.fn();

      hooks.register("multi:arg", multiArgHook);
      await hooks.call("multi:arg", "first", 42, true, { key: "value" });

      expect(multiArgHook).toHaveBeenCalledWith("first", 42, true, { key: "value" });
    });
  });
});
