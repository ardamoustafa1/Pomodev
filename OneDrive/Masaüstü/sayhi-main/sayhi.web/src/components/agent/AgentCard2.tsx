import { AgentStatus, type Agent } from "../../lib/Models"

export const AgentCard = ({ agent, onStatusChange, onDelete }: {
    agent: Agent;
    onStatusChange: (agentId: string, status: AgentStatus) => void;
    onDelete: (agentId: string) => void;
}) =>
{
    const getStatusColor = (status: AgentStatus) =>
    {
        switch (status)
        {
            case AgentStatus.Available: return "bg-green-100 text-green-800";
            case AgentStatus.Busy: return "bg-red-100 text-red-800";
            case AgentStatus.OnBreak: return "bg-yellow-100 text-yellow-800";
            case AgentStatus.Training: return "bg-blue-100 text-blue-800";
            case AgentStatus.Away: return "bg-gray-100 text-gray-800";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const getStatusText = (status: AgentStatus) =>
    {
        return AgentStatus[status];
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-gray-900">{agent.name}</h3>
                    <p className="text-gray-600">{agent.email}</p>
                    {agent.employeeId && (
                        <p className="text-sm text-gray-500">ID: {agent.employeeId}</p>
                    )}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(agent.status)}`}>
                    {getStatusText(agent.status)}
                </span>
            </div>

            <div className="space-y-2 mb-4">
                {agent.phoneNumber && (
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Phone:</span> {agent.phoneNumber}
                    </p>
                )}
                {agent.groupName && (
                    <p className="text-sm text-gray-600">
                        <span className="font-medium">Group:</span> {agent.groupName}
                    </p>
                )}
                <div className="flex space-x-4 text-sm text-gray-600">
                    <span>
                        <span className="font-medium">Skills:</span> {agent.skillCount}
                    </span>
                    <span>
                        <span className="font-medium">Queues:</span> {agent.activeQueueCount}
                    </span>
                </div>
            </div>

            <div className="flex space-x-2">
                <select
                    aria-label="Change agent status"
                    value={agent.status}
                    onChange={(e) => onStatusChange(agent.id, parseInt(e.target.value))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(AgentStatus)
                        .filter(([key]) => isNaN(Number(key)))
                        .map(([key, value]) => (
                            <option key={value} value={value}>
                                {key}
                            </option>
                        ))}
                </select>

                <button
                    onClick={() => onDelete(agent.id)}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md text-sm font-medium">
                    Delete
                </button>
            </div>
        </div>
    );
};