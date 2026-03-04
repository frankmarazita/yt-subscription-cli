import { initClient } from "@ts-rest/core";
import { initTsrReactQuery } from "@ts-rest/react-query/v5";
import { contract } from "@subs/contracts";
import { getApiBaseUrl } from "./api-client";

const baseConfig = { baseUrl: getApiBaseUrl(), baseHeaders: {} };

export const apiClient = initClient(contract, baseConfig);
export const tsrQueryClient = initTsrReactQuery(contract, baseConfig);
