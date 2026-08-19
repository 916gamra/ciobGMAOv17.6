import { WindowsBridge } from './windowsBridge';

export class WindowsRegistry {
  private static readonly BASE_KEY = 'Software\\BDR Systems\\BDR Nexus';

  static async readSetting(key: string): Promise<string | null> {
    return await WindowsBridge.readRegistrySetting(`${this.BASE_KEY}\\${key}`);
  }

  static async writeSetting(key: string, value: string): Promise<void> {
    await WindowsBridge.writeRegistrySetting(`${this.BASE_KEY}\\${key}`, value);
  }

  static async saveWindowState(width: number, height: number, x: number, y: number): Promise<void> {
    await this.writeSetting('WindowWidth', width.toString());
    await this.writeSetting('WindowHeight', height.toString());
    await this.writeSetting('WindowX', x.toString());
    await this.writeSetting('WindowY', y.toString());
  }

  static async restoreWindowState(): Promise<{ width: number; height: number; x: number; y: number }> {
    try {
      const widthStr = await this.readSetting('WindowWidth');
      const heightStr = await this.readSetting('WindowHeight');
      const xStr = await this.readSetting('WindowX');
      const yStr = await this.readSetting('WindowY');

      return {
        width: widthStr ? parseInt(widthStr, 10) : 1440,
        height: heightStr ? parseInt(heightStr, 10) : 900,
        x: xStr ? parseInt(xStr, 10) : 0,
        y: yStr ? parseInt(yStr, 10) : 0,
      };
    } catch {
      return { width: 1440, height: 900, x: 0, y: 0 };
    }
  }
}
