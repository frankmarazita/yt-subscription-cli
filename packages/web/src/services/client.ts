import { initClient } from '@ts-rest/core';
import { contract } from '@subs/contracts';
import { useConfigStore } from '../store/configStore';

function createClient() {
  const baseUrl = useConfigStore.getState().getActiveHost();
  return initClient(contract, { baseUrl, baseHeaders: {} });
}

export let apiClient = createClient();

export function reinitializeClients() {
  apiClient = createClient();
}
