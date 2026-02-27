import { api } from '../../core/services/http';
import type {
  CreateAgentAppRequest,
  EditAgentAppRequest,
  ForkEditStartRequest,
  AgentCreateAppResult,
  AgentEditAppResult,
  AgentForkEditStartResult,
} from './types';
import type { ServiceResponse } from '../types';
import { BaseRemote } from '../base-remote';

export interface AgentRemoteDataSource {
  createApp(payload: CreateAgentAppRequest): Promise<ServiceResponse<AgentCreateAppResult>>;
  editApp(payload: EditAgentAppRequest): Promise<ServiceResponse<AgentEditAppResult>>;
  forkEditStart(payload: ForkEditStartRequest): Promise<ServiceResponse<AgentForkEditStartResult>>;
}

class AgentRemoteDataSourceImpl extends BaseRemote implements AgentRemoteDataSource {
  async createApp(payload: CreateAgentAppRequest): Promise<ServiceResponse<AgentCreateAppResult>> {
    const { data } = await api.post<ServiceResponse<AgentCreateAppResult>>('/v1/agent/createApp', payload);
    return data;
  }

  async editApp(payload: EditAgentAppRequest): Promise<ServiceResponse<AgentEditAppResult>> {
    const { data } = await api.post<ServiceResponse<AgentEditAppResult>>('/v1/agent/editApp', payload);
    return data;
  }

  async forkEditStart(payload: ForkEditStartRequest): Promise<ServiceResponse<AgentForkEditStartResult>> {
    const { data } = await api.post<ServiceResponse<AgentForkEditStartResult>>('/v1/agent/forkEditStart', payload);
    return data;
  }
}

export const agentRemoteDataSource: AgentRemoteDataSource = new AgentRemoteDataSourceImpl();


