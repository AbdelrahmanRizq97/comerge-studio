import axios from "axios";

import { BASE_URL } from "./baseUrl";

const CLIENT_KEY_HEADER = "x-comerge-api-key";
let clientApiKey: string | null = null;

export const publicApi = axios.create({
	baseURL: BASE_URL,
	timeout: 30_000,
	headers: {
		Accept: "application/json",
		"Content-Type": "application/json",
	},
});

export function setClientApiKey(apiKey: string) {
	const trimmed = apiKey?.trim?.() ?? "";
	if (!trimmed) {
		throw new Error("comerge-studio: apiKey is required");
	}
	clientApiKey = trimmed;
	publicApi.defaults.headers.common[CLIENT_KEY_HEADER] = trimmed;
}

publicApi.interceptors.request.use((config) => {
	if (!clientApiKey) return config;
	config.headers = config.headers ?? {};
	(config.headers as any)[CLIENT_KEY_HEADER] = clientApiKey;
	return config;
});


