import { BaseRepository } from "../../base-repository";
import type { StudioConfig } from "./types";
import type { StudioConfigRemoteDataSource } from "./remote";
import { studioConfigRemoteDataSource } from "./remote";

export interface StudioConfigRepository {
	get(): Promise<StudioConfig>;
}

class StudioConfigRepositoryImpl extends BaseRepository implements StudioConfigRepository {
	constructor(private readonly remote: StudioConfigRemoteDataSource) {
		super();
	}

	async get(): Promise<StudioConfig> {
		const res = await this.remote.get();
		return this.unwrapOrThrow(res);
	}
}

export const studioConfigRepository: StudioConfigRepository = new StudioConfigRepositoryImpl(studioConfigRemoteDataSource);


