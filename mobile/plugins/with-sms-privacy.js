const { withAndroidManifest } = require("expo/config-plugins");

module.exports = function withSmsPrivacy(config) {
  return withAndroidManifest(config, (mod) => {
    const application = mod.modResults.manifest.application[0].$;
    application["android:allowBackup"] = "false";
    application["android:fullBackupContent"] = "@xml/smishguard_backup_rules";
    application["android:dataExtractionRules"] =
      "@xml/smishguard_data_extraction_rules";
    return mod;
  });
};
