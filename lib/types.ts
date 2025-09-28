export interface PluginConfig {
  srcDir?: string;
  distDir?: string;
  repoUrl?: string;
  repoUsername?: string;
  repoToken?: string;
  pypiPublish?: boolean;
  gpgSign?: boolean;
  gpgIdentity?: string;
  envDir?: string | false;
  installDeps?: boolean;
  versionCmd?: string | string[];
}
