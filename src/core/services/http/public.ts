import axios from "axios";

import { BASE_URL } from "./baseUrl";

const CLIENT_KEY_HEADER = "x-comerge-api-key";
let clientKey: string | null = null;

export const publicApi = axios.create({
	baseURL: BASE_URL,
	timeout: 30_000,
	headers: {
		Accept: "application/json",
		"Content-Type": "application/json",
	},
});

export function setClientKey(clientKeyInput: string) {
	const trimmed = clientKeyInput?.trim?.() ?? "";
	if (!trimmed) {
		throw new Error("comerge-studio: clientKey is required");
	}
	clientKey = trimmed;
	publicApi.defaults.headers.common[CLIENT_KEY_HEADER] = trimmed;
}

publicApi.interceptors.request.use((config) => {
	if (!clientKey) return config;
	config.headers = config.headers ?? {};
	(config.headers as any)[CLIENT_KEY_HEADER] = clientKey;
	return config;
});


