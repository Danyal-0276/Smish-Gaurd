const { withProjectBuildGradle } = require('expo/config-plugins');

// Preserve the fix across Expo native regeneration; do not patch node_modules.
module.exports = function withShortCmakePaths(config) {
  return withProjectBuildGradle(config, (mod) => {
    const marker = '// SmishGuard: bounded CMake object paths for Windows';
    if (!mod.modResults.contents.includes(marker)) {
      mod.modResults.contents += `
${marker}
subprojects { subproject ->
  ['com.android.library', 'com.android.application'].each { pluginId ->
    subproject.plugins.withId(pluginId) {
      subproject.android.defaultConfig.externalNativeBuild.cmake.arguments '-DCMAKE_OBJECT_PATH_MAX=240'
      // A Windows 8.3 alias can hide the ++ in clang++.exe. The NDK appends
      // this user flag to its normal security/compiler flags.
      if (System.getProperty('os.name').toLowerCase().contains('windows')) {
        subproject.android.externalNativeBuild.cmake.buildStagingDirectory = rootProject.file("../../.setup/cxx/" + subproject.name)
        subproject.android.defaultConfig.externalNativeBuild.cmake.arguments '-DCMAKE_CXX_FLAGS=--driver-mode=g++'
      }
    }
  }
}
`;
    }
    return mod;
  });
};
