import type { AgentRemoteDataSource } from './remote';
import { agentRemoteDataSource } from './remote';
import type {
  AgentCreateAppResult,
  AgentEditAppResult,
  AgentForkEditStartResult,
  CreateAgentAppRequest,
  EditAgentAppRequest,
  ForkEditStartRequest,
} from './types';
import { BaseRepository } from '../../data/base-repository';

export interface AgentRepository {
  createApp(payload: CreateAgentAppRequest): Promise<AgentCreateAppResult>;
  editApp(payload: EditAgentAppRequest): Promise<AgentEditAppResult>;
  forkEditStart(payload: ForkEditStartRequest): Promise<AgentForkEditStartResult>;
}

class AgentRepositoryImpl extends BaseRepository implements AgentRepository {
  constructor(private readonly remote: AgentRemoteDataSource) {
    super();
  }

  async createApp(payload: CreateAgentAppRequest): Promise<AgentCreateAppResult> {
    const res = await this.remote.createApp(payload);
    return this.unwrapOrThrow(res);
  }

  async editApp(payload: EditAgentAppRequest): Promise<AgentEditAppResult> {
    const res = await this.remote.editApp(payload);
    return this.unwrapOrThrow(res);
  }

  async forkEditStart(payload: ForkEditStartRequest): Promise<AgentForkEditStartResult> {
    const res = await this.remote.forkEditStart(payload);
    return this.unwrapOrThrow(res);
  }
}

export const agentRepository: AgentRepository = new AgentRepositoryImpl(agentRemoteDataSource);


