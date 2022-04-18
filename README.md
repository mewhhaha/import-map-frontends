# Microfrontends using import maps

This is an example project showing how you can implement microfrontends using [import maps](https://github.com/WICG/import-maps) and es-modules. This is made using some assumptions:

- The project is (and will remain) a React project
- The project only targets browsers that support es-modules

## How to try things out

This project is built as a monorepo with two packages `@example/app` and `@example/micro`. The easiest way of accomplishing this is simply to use [pnpm](https://pnpm.io/) as the package manager, so I highly recommend downloading that.

```bash
# All these commands are run in the root of the project

# Install dependencies
pnpm i

# Build the projects
pnpm build

# Preview the projects in the browser
pnpm preview
```

There are a few things happening here, the main application is being served at http://localhost:4174 and a microfrontend (JavaScript) is being served at http://localhost:3001. If you go to the main application at http://localhost:4174 you can filter the network requests by "index.js" and you'll see one of them being loaded from http://localhost:3001. This is the reference made by the import map located in [/app/index.html](/app/index.html).

To try out the decoupled nature of these two code bases, you can update something in [/micro/src/main.tsx] and then rebuild. If you've run the previous commands then you are already serving the built artifact so you simply have to refresh the page after you've built.

```bash
# Works everywhere
pnpm build --filter micro

# If you are already in the /micro directory
pnpm build
```

## Why did you do this?

It's not anything new, but it's _easy_. And sometimes easy is amazing.

## How does this work?

The original idea is basically the same as lazy-loading JavaScript from a different location that can be deployed separately. This is quite easy, but the issue occurs when attempting to pull in different versions of `react` where the whole application will break. This _can_ be resolved by simply referencing the same `react` from a CDN somewhere, however this risks breaking the application if they start to accidentally reference different versions. Instead in this example we keep the imports form `react` and `react-dom` external. Below is what's built for the `@example/micro` package, and you can see that the `react` imports have remained in the built bundle.

```js
import { useState } from "react";
import { jsxs, jsx } from "react/jsx-runtime";
const App = () => {
  const [count, setCount] = useState(0);
  return /* @__PURE__ */ jsxs("div", {
    children: [
      /* @__PURE__ */ jsx("div", {
        children: `You've pressed the button ${count} times!`,
      }),
      /* @__PURE__ */ jsx("button", {
        onClick: () => {
          setCount((prev) => prev + 1);
        },
        children: "Press!",
      }),
    ],
  });
};
export { App as default };
```

This is essentially a peer dependency. But the names `react` and `react/jsx-runtime` don't mean anything when they get loaded in the browser and you'll have errors complaining about not being able to resolve them. This is where the import maps come in. The import map acts as a lookup table which let's us resolve these peer dependencies. And this means that whatever the main application resolves `react` to, will be the `react` that we'll be using. You can see the example of the import map that we are using the project below.

```html
<script type="importmap">
  {
    "imports": {
      "@example/micro": "http://localhost:3001/index.js",
      "react": "https://esm.sh/react",
      "react-dom": "https://esm.sh/react-dom",
      "react/jsx-runtime": "https://esm.sh/react/jsx-runtime"
    }
  }
</script>
```

## The not so good news

I would grade this as "almost working". There are some caveats that you should consider if you are to deploy this into a production environment.

### Import maps aren't widely adopted

Import maps are (at the time of writing) only supported in Chrome, so to get it working in other browsers I've added a dependency called [es-module-shims](https://github.com/guybedford/es-module-shims). This makes it work in other browsers, like Firefox and Safari.

```html
<script
  async
  src="https://ga.jspm.io/npm:es-module-shims@1.5.4/dist/es-module-shims.js"
></script>
```

### React isn't ESM

Because `react` and `react-dom` doesn't by default export itself as es-modules I've used a CDN-service that does this for me: https://esm.sh/. If you were to deploy this into production it would be a good idea to rebundle `react` and `react-dom` yourself and serve it as es-modules at a location of your choosing.

### This is still a single application

This method is essentially just an extension of the code-splitting pattern that we're all very familiar with. That means that each microfrontend is still part of a _single_ application. Meaning that you need to scope globals down to your page, like CSS. If you're using Styled Components, then you're already good to go. If you're using Tailwind, then add a specificity selector. If you're using vanilla CSS, then it might be a good idea to shove everything in CSS modules.

### Decoupling your microfrontends

The idea behind this method is to have each microfrontend bundle all their own dependencies and then only leverage a tiny number of dependencies to be resolved by the main application, usually `react`, `react-dom` and `react/jsx-runtime` but could include for example `react-router` or `react-router-dom`. If you were previously relying on global providers then you'd have to move those up into your page, as you'd no longer be able to access them from the main application. But this is the normal cost of making microfrontends.

### How to develop?

The example doesn't give a good development experience. I've avoided adding that because it felt like it'd muddy the example. What could be done is simply having each package start up their own application with the exception that they'll reference the current package being developed as source code. Using `vite` you can have it both as a development server and bundler.
