import { ModuleManager } from '../app/ModuleManager';

export interface DebugPanelConfig {
  enabled: boolean;
  moduleManager: ModuleManager;
  enterModuleId?: string;
  reconnectUrl?: string;
}

