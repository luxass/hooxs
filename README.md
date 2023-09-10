# hooxs

Effortlessly empower your project with typed hooks, enabling you to easily construct a plugin API for your needs. ✨
<br/>
<br/>

## 📦 Installation

```sh
npm install hooxs
```

## 📚 Usage

> [!NOTE]  
> If you wan't a more detailed example, check out [plundle](https://github.com/luxass/plundle) which uses hooxs. You can find the exact implementation [here](https://github.com/luxass/plundle/blob/main/src/api.ts)

```ts
import { createHooks } from "hooxs";

interface RuntimeHooks {
  "build:before": () => void
  "build:after": (files: string[]) => void
  // can either be registered inside the hooks object or registered at a later point
  "config:load"?: (config: Record<string, unknown>) => void
}

const hooks = createHooks<RuntimeHooks>({
  "build:before": () => {
    console.log("before build");
  },
  "build:after": (files) => {
    console.log("after build", files);
  },
});
// or initialize hooks at a later point
const hooks = createHooks<RuntimeHooks>();

hooks.on("config:load", (config) => {
  console.log("config loaded", config);
});

await hooks.call("build:before");
const files = ["index.js", "index.css"];

await hooks.call("build:after", files);
```



## 💻 Development

- Clone this repository
- Enable [Corepack](https://github.com/nodejs/corepack) using `corepack enable` (use `npm i -g corepack` for Node.js < 16.10)
- Install dependencies using `pnpm install`
- Run tests using `pnpm dev`

Published under [MIT License](./LICENCE).
