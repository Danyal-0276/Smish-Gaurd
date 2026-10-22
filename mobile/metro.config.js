const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const inherited = config.resolver.blockList;
const blockList = Array.isArray(inherited) ? inherited : inherited ? [inherited] : [];
// Kotlin/Gradle output is not JavaScript. Large native rebuilds must not trigger
// Metro to crawl generated classes, CMake outputs and intermediate resources.
for (const folder of ["android", "ios", "modules/smishguard-sms/android"]) {
  const absolute = path.resolve(__dirname, folder).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  blockList.push(new RegExp(`^${absolute}(?:[\\\\/].*)?$`));
}
config.resolver.blockList = blockList;
config.maxWorkers = 2;

module.exports = config;
