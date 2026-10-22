// Regenerate from the actual app directory before checking. The SDK's Windows
// watcher can retain stale routes while native files are being added.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const cli = require.resolve("@expo/cli/package.json", {
  paths: [path.dirname(require.resolve("expo/package.json"))],
});
const generator = require.resolve("@expo/router-server/build/typed-routes", {
  paths: [path.dirname(cli)],
});
process.env.EXPO_ROUTER_APP_ROOT = path.join(root, "src", "app");
const output = path.join(root, ".expo", "types");
fs.mkdirSync(output, { recursive: true });
require(generator).regenerateDeclarations(output);
