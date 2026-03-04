import { initClient } from "@ts-rest/core";
import { initTsrReactQuery } from "@ts-rest/react-query/v5";
import { contract } from "@subs/contracts";
import { getApiBaseUrl } from "./api-client";

function createClients() {
  const baseConfig = { baseUrl: getApiBaseUrl(), baseHeaders: {} };
  return {
    apiClient: initClient(contract, baseConfig),
    tsrQueryClient: initTsrReactQuery(contract, baseConfig),
  };
}

let clients = createClients();
export let apiClient = clients.apiClient;
export let tsrQueryClient = clients.tsrQueryClient;

export function reinitializeClients() {
  clients = createClients();
  apiClient = clients.apiClient;
  tsrQueryClient = clients.tsrQueryClient;
}
