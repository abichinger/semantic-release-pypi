export interface PluginConfig {
  srcDir?: string;
  distDir?: string;
  repoUrl?: string;
  pypiPublish?: boolean;
  gpgSign?: boolean;
  gpgIdentity?: string;
  envDir?: string | false;
  installDeps?: boolean;
}
