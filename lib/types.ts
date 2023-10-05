export interface PluginConfig {
  setupPy?: string;
  distDir?: string;
  repoUrl?: string;
  pypiPublish?: boolean;
  gpgSign?: boolean;
  gpgIdentity?: string;
}
