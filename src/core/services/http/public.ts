import axios from "axios";

import { BASE_URL } from "./baseUrl";

export const publicApi = axios.create({
	baseURL: BASE_URL,
	timeout: 30_000,
	headers: {
		Accept: "application/json",
		"Content-Type": "application/json",
	},
});


