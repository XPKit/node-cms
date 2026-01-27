# GitHub Copilot Instructions

This document provides rules and context for GitHub Copilot. Following these instructions is crucial for maintaining code quality, consistency, and adhering to the architectural patterns of our projects.

---

## 1. General Coding Principles & Style

These rules apply to all projects unless overridden by project-specific instructions.

### 1.1. Naming Conventions
- **Clarity is Key:** Class, function, and variable names must be explicit and clearly convey their purpose.
- **camelCase:** Use `camelCase` for all variable and function names.
  - **Good:** `const myVariable = 'value';`
  - **Bad:** `var my_variable = 'value';`
- **PascalCase:** Use `PascalCase` for class names.
  - **Good:** `class UserSession { ... }`

### 1.2. Code Structure & Formatting
- **Line Length:** Lines should not exceed 80 characters. Functions should ideally be a maximum of 25 lines.
- **Imports:** Place all `import` or `require` statements at the very top of the file. Dynamic imports are the only exception.
- **Variable Declarations:** Use `const` by default and `let` only when a variable must be reassigned. Never use `var`. Declare variables at the top of their scope (function or block).
- **Brackets for `if` statements:** Always use curly brackets `{}` for `if` statements, even for single-line blocks.
  - **Exception:** Allowed for single-line logging calls or callbacks with static strings.
  - **Good:** `if (condition) { return value; }`
  - **Bad:** `if (condition) return value`
  - **Allowed:** `if (error) logger.error('Failed to process request');`
- **Strict Equality:** Always use `===` and `!==` for comparisons instead of `==` and `!=`.
- **No `switch` Statements:** Use `if/else if/else` chains instead of `switch` statements.

### 1.3. Comments & Documentation
- **Comments:** Only add comments for complex logic, algorithms, or "why" something is done a certain way. Do not comment on obvious code.
- **JSDoc for Backend:** Always generate full JSDoc blocks for all backend classes and functions, detailing their purpose, parameters, and return values.
- **No Emojis:** Never use emojis in code, comments, or commit messages.

### 1.4. Error Handling
- **`try/catch` Blocks:** When using a `try/catch` block, the `catch` block must always log the error. Do not leave it empty.
  ```javascript
  // Good
  try {
    await riskyOperation();
  } catch (error) {
    console.error('Risky operation failed:', error);
    // Potentially re-throw or handle the error
  }
  ```
- **Custom Error Middleware (Express):** In Express.js applications, use a dedicated error-handling middleware for centralized error processing.

### 1.5. Asynchronous Code
- **`async/await`:** Always prefer `async/await` over Promise `.then()` chains for cleaner, more readable asynchronous code.
  - **Good:** `const result = await myAsyncFunction();`
  - **Bad:** `myAsyncFunction().then(result => { /* ... */ });`
- **Variable for `await`:** When using an awaited promise as a function parameter, always store its result in a variable first. This improves readability and debugging.
  - **Good:**
    ```javascript
    const value = await getValue();
    doSomething(value);
    ```
  - **Bad:** `doSomething(await getValue());`

---

## 2. Technology & Library-Specific Rules

### 2.1. JavaScript & Node.js
- **`fs-extra` over `fs`:** Always use the `fs-extra` library for file system operations instead of the native `fs` module.
- **`fetch` for Network Requests:** Use the native `fetch` API for all HTTP requests. Do not use `axios`, `request`, or other libraries. Remember to handle non-ok responses, as `fetch` does not reject on HTTP errors like 4xx or 5xx.
- **Lodash:**
    - **Prefer Lodash Functions:** Use Lodash functions over native JavaScript equivalents where available (e.g., `_.isArray` instead of `Array.isArray`).
    - **Chaining:** Use `_.chain()` when applying multiple sequential Lodash operations to an object or array.
        - **Good:** `const result = _.chain(arr).map(fn).compact().uniq().value();`
        - **Bad:** `const result = _.uniq(_.compact(_.map(arr, fn)));`
    - **`_.get` Default Value:** Always provide a default value as the third argument to `_.get` to prevent `undefined` results.
        - **Good:** `const name = _.get(user, 'profile.name', 'N/A');`
        - **Bad:** `const name = _.get(user, 'profile.name');`
- **Backend File Structure:** When creating a new backend file, export a `class` rather than exporting individual functions.

### 2.2. Vue.js (Frontend)
- **Component Naming:** Component filenames should be `PascalCase` (e.g., `UserProfile.vue`).
- **Options API:** All Vue components must use the **Options API**. Do not use the Composition API.
- **Block Spacing:** Do not leave empty lines between methods inside the `methods` object or between the top-level `<template>`, `<script>`, and `<style>` blocks.
- **CSS Class Naming:** All CSS class names in templates must be in `kebab-case`.
  - **Good:** `<div class="my-component-container"></div>`
  - **Bad:** `<div class="myComponentContainer"></div>`
- **Event Naming:** Emitted event names must follow the `feature:action` convention.
  - **Good:** `this.$emit('user:save-profile');`
  - **Bad:** `this.$emit('save');`
- **Vite Aliases:** Always use Vite path aliases (e.g., `@/`) for imports within the Vue application.
  - **Good:** `import MyComponent from '@/components/MyComponent.vue';`
  - **Bad:** `import MyComponent from '../../components/MyComponent.vue';`
- **SVG Handling:** Load SVGs as files via `<img>` tags or as Vue components. Do not write inline `<svg>` markup directly in a component's template.
  - **Good:** `<img src="@/assets/icons/my-icon.svg" alt="My Icon" />`
  - **Bad:** `<template><svg>...</svg></template>`
- **Template Line Length:** In the `<template>` section, fit element attributes onto a single line if it does not exceed 80 characters. If it does, put as many attributes as you can on lines of 80 characters or less. Avoid putting one attribute per line unless absolutely necessary for readability.
  - **Good:** `<v-btn color="primary" @click="handleClick">Click Me</v-btn>`
  - **Bad:**
    ```
      <v-btn
      color="primary"
      @click="handleClick"
      class="my-button-class"
      >
      Click Me
      </v-btn>
    ```
- **Props:** All component props must have a `type` defined. Add a `default` value for non-required props. and the definition of a prop should always be on 1 line
  - **Good:**
    ```javascript
    props: {
      myProp: { type: String, default: 'defaultValue' }
    }
    ```
  - **Bad:**
    ```javascript
    props: {
      myProp: {
        type: String,
        default: 'defaultValue'
      }
    }
    ```
- **`v-for` Keys:** Always provide a unique `:key` attribute when using the `v-for` directive.

### 2.3. Styling (SCSS)
- **Use SCSS:** All styling must be written in SCSS, not plain CSS.
- **Nesting:** Use SCSS nesting to reflect the HTML structure and scope styles logically.

### 2.4. Testing
- **Test Filenames:** Test script filenames must be prefixed with `test-` (e.g., `test-user-api.js`).

### 2.5. Terminal Commands
- **Environment:** Assume all commands are run on **Windows 11** using **PowerShell**.
- **Package Manager:** Always use `npm`. Do not use `yarn` or `pnpm`.
- **Chaining Commands:** Use a semicolon `;` to chain commands (e.g., `npm install; npm run dev`).

---

## 3. Project-Specific Rules: `node-cms`

These rules provide deep context for the `node-cms` repository.

### 3.1. Architecture Overview
- **Core:** A flexible CMS built on Express.js. The main class is exported from `index.js`. Core data logic is in `lib/resource.js`.
- **Storage:** Uses a dual-store system: JSON documents for metadata and chunked blobs for file attachments. Supports LevelDB (default) and MongoDB.
- **Plugins:** Features are modular and located in `lib/plugins/` (e.g., REST API, admin UI, authentication).
- **Resources:** Data models are defined by schemas in `resources/*.js`. These schemas auto-generate the REST API and the admin UI.
- **Frontend:** The admin panel is a Vue 3 application using the Vuetify component library, built with Vite.

### 3.2. Critical Files for Context
- `index.js`: Main CMS class, configuration, and bootstrapping.
- `lib/resource.js`: Core data operations (CRUD) and attachment handling.
- `lib/plugins/rest/index.js`: REST API implementation.
- `server.js`: Example server startup, database configuration.
- `vite.config.js`: Frontend build and development server configuration.
- `resources/`: Directory containing all resource schema definitions.

### 3.3. Critical Patterns
- **CMS Initialization:** Always bootstrap the CMS instance before use.
  ```javascript
  const CMS = require('./index.js');
  const cms = new CMS({ data: './data', locales: ['enUS'] });
  await cms.bootstrap(); // This step is crucial
  const api = cms.api();
  ```
- **Resource Schema:** Resources are plain JS objects defining a data model.
  ```javascript
  // resources/articles.js
  module.exports = {
    displayname: { enUS: 'Articles' },
    schema: [
      { field: 'title', input: 'text', required: true },
      { field: 'body', input: 'wysiwyg' }
    ]
  };
  ```
- **Attachment Handling:** Use streams for creating attachments to handle large files efficiently.
  ```javascript
  const attachment = await resource.createAttachment(id, {
    stream: fileStream,
    fields: { _filename: 'photo.jpg' }
  });
  ```

### 3.4. Common Gotchas
- The `cms.bootstrap()` method **must** be called before any API or resource interaction.
- Plugins in `lib/plugins` may have initialization dependencies; their order can matter.
- The Vue admin panel has a separate build process (Vite) from the Node.js backend.
