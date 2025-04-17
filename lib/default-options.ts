import path from 'path';
import { PluginConfig } from './types.js';

export class DefaultConfig {
  config: PluginConfig;

  constructor(config: PluginConfig) {
    this.config = config;
  }

  public get srcDir() {
    return this.config.srcDir ?? '.';
  }

  public get setupPath(): string {
    return path.join(this.srcDir, 'setup.py');
  }

  public get pyprojectPath(): string {
    return path.join(this.srcDir, 'pyproject.toml');
  }

  public get distDir() {
    return this.config.distDir ?? 'dist';
  }

  public get repoUrl() {
    return this.config.repoUrl ?? 'https://upload.pypi.org/legacy/';
  }

  public get repoUsername() {
    return this.config.repoUsername ?? '__token__';
  }

  public get repoToken() {
    return this.config.repoToken ?? '';
  }

  public get pypiPublish() {
    return this.config.pypiPublish ?? true;
  }

  public get gpgSign() {
    return this.config.gpgSign ?? false;
  }

  public get gpgIdentity() {
    return this.config.gpgIdentity;
  }

  public get envDir() {
    return this.config.envDir ?? '.venv';
  }

  public get installDeps() {
    return this.config.installDeps ?? true;
  }

  public get versionCmd() {
    return this.config.versionCmd;
  }
}
