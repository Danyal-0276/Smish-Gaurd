const { withProjectBuildGradle } = require("expo/config-plugins");

// Preserve the fix across Expo native regeneration; do not patch node_modules.
module.exports = function withShortCmakePaths(config) {
  return withProjectBuildGradle(config, (mod) => {
    const marker = "// SmishGuard: bounded CMake object paths for Windows";
    if (!mod.modResults.contents.includes(marker)) {
      const nativeFixes = `
${marker}
subprojects { subproject ->
  ['com.android.library', 'com.android.application'].each { pluginId ->
    subproject.plugins.withId(pluginId) {
      subproject.android.defaultConfig.externalNativeBuild.cmake.arguments '-DCMAKE_OBJECT_PATH_MAX=240'
      // A Windows 8.3 alias can hide the ++ in clang++.exe. The NDK appends
      // this user flag to its normal security/compiler flags.
      if (System.getProperty('os.name').toLowerCase().contains('windows')) {
        subproject.android.externalNativeBuild.cmake.buildStagingDirectory = rootProject.file("../../.setup/cxx/" + subproject.name)
        def ninja = rootProject.file("../../.setup/tools/ninja-1.13.2/ninja.exe")
        if (!ninja.exists()) {
          throw new GradleException("Run mobile/scripts/setup-ninja.ps1 before building on Windows.")
        }
        subproject.android.defaultConfig.externalNativeBuild.cmake.arguments "-DCMAKE_MAKE_PROGRAM=" + ninja.absolutePath.replace('\\\\', '/')
        subproject.android.defaultConfig.externalNativeBuild.cmake.arguments '-DCMAKE_CXX_FLAGS=--driver-mode=g++'
      }
    }
  }
}
`;
      // Register callbacks before the React root plugin evaluates :app.
      const anchor = 'apply plugin: "expo-root-project"';
      mod.modResults.contents = mod.modResults.contents.includes(anchor)
        ? mod.modResults.contents.replace(anchor, nativeFixes + "\n" + anchor)
        : mod.modResults.contents + nativeFixes;
    }
    return mod;
  });
};
