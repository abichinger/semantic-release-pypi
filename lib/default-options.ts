import path from 'path';
import { PluginConfig } from './types';

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
