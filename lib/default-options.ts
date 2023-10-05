import { PluginConfig } from './types';

export class DefaultConfig {
  config: PluginConfig;

  constructor(config: PluginConfig) {
    this.config = config;
  }

  public get setupPy() {
    return this.config.setupPy ?? './setup.py';
  }

  public get distDir() {
    return this.config.distDir ?? 'dist';
  }

  public get repoUrl() {
    return this.config.repoUrl ?? 'https://upload.pypi.org/legacy/';
  }

  public get pypiPublish() {
    return this.config.pypiPublish ?? true;
  }

  public get gpgSign() {
    return this.config.gpgSign ?? false;
  }

  public get gpgIdentity() {
    return this.config.gpgIdentity ?? null;
  }
}
