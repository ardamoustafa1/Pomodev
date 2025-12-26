//import { boolean } from "zod";

export interface HasId
{
    id: string | number;
    [key: string]: any;
}


export interface User
{
	id: string;
	name: string;
	email: string;
	avatar: string;
	password: string;
}

export enum PeerType
{
    Agent = 0,
    Customer = 1,
    AI = 2
}

export interface Peer
{
	id: string;
	name: string;
	connectionId: string;
	type: PeerType;
	avatar: string;
	email: string;
}

export interface InteractionInfo
{
	id: string;
	caller: Peer;
    name: string;
    phone: string;
    message: string;
}

export interface Chat
{
	id: string;
	name: string;
	//email: string; // Obsolote
	//avatar: string; // Obsolote
	participants: ChatParticipant[];
	typings: Map<string, number>;
	typingIndicator: string | undefined;
	//participantMap: Map<number, ChatParticipant>;
	createdAt: Date;
	lastMessage: string;
	source: SourceType;
	tags: Map<string, AlertType>;
	unreadCount: number;
	//isOnline: boolean;
}

export enum AlertType
{
	Normal = 0,
	Info = 1,
	Warn = 2,
	Alert = 3
}

export enum SourceType
{
	None = 0,
	Chat = 1,
	Whatsapp = 2,
	Twitter = 3,
	Instagram = 4,
	Facebook = 5, //Messenger = 5,
	Telegram = 6
}

export interface ChatMessage
{
	id: string;
	senderId: string;
	text: string;
	createdAt: Date;
	isOwn: boolean;
	status: "None" | "Sent" | "Delivered" | "Read";
}

export interface ChatParticipant
{
	id: string;
	name: string;
	email: string;
	avatar: string;
	isOnline: boolean;
}


// API types
export interface Agent
{
	id: string;
	employeeId?: string;
	status: AgentStatus;
	personId: string;
	avatarUrl?: string;
	groupId?: string;
	createdAt: string;
	lastActivityAt?: string;
	name: string;
	email: string;
	phoneNumber?: string;
	groupName?: string;
	skillCount: number;
	activeQueueCount: number;
}

export interface AgentDetail extends Agent
{
	skills: AgentSkill[];
	queueAssignments: QueueAssignment[];
}

export interface AgentSkill
{
	agentId: string;
	skillId: string;
	skillName: string;
	skillCategory: SkillCategory;
	proficiency: ProficiencyLevel;
	isPrimary: boolean;
	certifiedAt: string;
}

export interface QueueAssignment
{
	id: string;
	queueId: string;
	queueName: string;
	assignedAt: string;
	unassignedAt?: string;
	priority: number;
	isActive: boolean;
}

export interface CreateAgentRequest
{
	personId: string;
	employeeId?: string;
	groupId?: string;
	status: AgentStatus;
}

export interface UpdateAgentRequest
{
	employeeId?: string;
	groupId?: string;
	status?: AgentStatus;
}

export interface AddAgentSkillRequest
{
	skillId: string;
	proficiency: ProficiencyLevel;
	isPrimary?: boolean;
}

export enum AgentStatus
{
	Available = 0,
	Busy = 1,
	OnBreak = 2,
	Training = 3,
	Away = 4
}

export enum ProficiencyLevel
{
	Beginner = 0,
	Intermediate = 1,
	Advanced = 2,
	Expert = 3
}

export enum SkillCategory
{
	Language = 0,
	Technical = 1,
	Sales = 2,
	Billing = 3,
	Support = 4,
	Specialized = 5
}

/*
export type AgentStatus2 =
  | "Available"
  | "Busy"
  | "OnBreak"
  | "Training"
  | "Inactive";

export type ProficiencyLevel =
  | "Beginner"
  | "Intermediate"
  | "Advanced"
  | "Expert";

export type SkillCategory =
  | "Language"
  | "Technical"
  | "Sales"
  | "Billing"
  | "Support"
  | "Specialized";
*/

// API response types
/*
export interface ApiResponse<T>
{
	data: T;
	success: boolean;
	message?: string;
}
*/

export interface PaginatedResponse<T>
{
	items: T[];
	page: number;
	pageSize: number;
	//totalCount: number;
	//totalPages: number;
}

export interface Group
{
	id: string;
	name: string;
	description?: string;
	type: GroupType;
	manager?: Agent;
	isActive: boolean;
	createdAt: string;
}

export enum GroupType
{
	None = 0,
	Sales = 1,
	Support = 2,
	Technical = 3,
	Specialized = 4,
	Management = 5
}

export interface Queue
{
	id: string;
	name: string;
	description?: string;
	type: QueueType;
	priority: number;
	maxWaitTime: number;
	maxConcurrentCalls: number;
	isActive: boolean;
	group?: Group;
	createdAt: string;
}

export enum QueueType
{
	None = 0,
	Inbound = 1,
	Outbound = 2,
	Callback = 3,
	Priority = 4,
	VIP = 5
}