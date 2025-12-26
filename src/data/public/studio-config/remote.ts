import { publicApi } from "../../../core/services/http/public";
import type { ServiceResponse } from "../../types";
import { BaseRemote } from "../../base-remote";
import type { StudioConfig } from "./types";

export interface StudioConfigRemoteDataSource {
	get(): Promise<ServiceResponse<StudioConfig>>;
}

class StudioConfigRemoteDataSourceImpl extends BaseRemote implements StudioConfigRemoteDataSource {
	async get(): Promise<ServiceResponse<StudioConfig>> {
		const { data } = await publicApi.get<ServiceResponse<StudioConfig>>("/v1/public/studio-config");
		return data;
	}
}

export const studioConfigRemoteDataSource: StudioConfigRemoteDataSource = new StudioConfigRemoteDataSourceImpl();


