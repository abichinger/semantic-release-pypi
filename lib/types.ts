export interface PluginConfig {
  srcDir?: string;
  distDir?: string;
  repoUrl?: string;
  pypiPublish?: boolean;
  gpgSign?: boolean;
  gpgIdentity?: string;
}
