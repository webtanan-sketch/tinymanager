import { getAssistantAction as getCoreAssistantAction } from './action-registry';
import { getModuleAssistantAction } from './module-actions';

export const getAssistantAction = (id: string) =>
  getModuleAssistantAction(id) ?? getCoreAssistantAction(id);
