# 3DBAG Viewer

This is the repository for the components of the website and viewer of the 3DBAG. For general 3DBAG or data-related questions, issues see https://docs.3dbag.nl/en/contact/ . 

## Installation

Requires Node version 26 (you can use [nvm](https://github.com/nvm-sh/nvm) to install)

```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Environment-specific URLs

The viewer resolves the URLs in `src/assets/3dbag_versions.json` at build time.
Production URLs are the defaults. To build against a local services stack, copy
`.env.local.example` to `.env.local` and run `npm run build` or `npm run serve`.

The main service variables are `VUE_APP_WEB_URL`, `VUE_APP_DOCS_URL`,
`VUE_APP_API_URL`, `VUE_APP_DATA_URL`, and `VUE_APP_DASHBOARD_URL`.

### Lints and fixes files
```
npm run lint
```

## Development

### Following the guidelines

We are using [ESLint](https://eslint.org/) to enforce Vue's [style guide](https://v3.vuejs.org/style-guide/). This means, the project will not compile if those guidelines are not followed.

#### Automatically fix issues

Just run:
```
npm run lint
```

#### Using Visual Studio Code

If you are using VS Code for development, you can enable ESLint suggestions on the editor:

1. Install the [Vuter](https://marketplace.visualstudio.com/items?itemName=yoyo930021.vuter) and [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) plugins
2. Add the following lines to your VS Code `setting.json`:
```JSON
"eslint.validate": [
    "javascript",
    "javascriptreact",
    "vue"
],
"vetur.validation.template": false
```

## 3DBAG organisation

This software is part of the 3DBAG project. For more information visit the [3DBAG organisation](https://github.com/3DBAG).
