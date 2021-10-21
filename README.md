# 3D BAG Viewer

This is the repository for the components of the website and viewer of the 3D BAG. For general 3D BAG or data-related questions, issues see https://docs.3dbag.nl/en/contact/ . 

## Installation
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
