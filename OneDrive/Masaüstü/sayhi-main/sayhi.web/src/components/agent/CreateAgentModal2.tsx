import React, { useState } from "react"
import { AgentStatus, type CreateAgentRequest } from "../../lib/Models"

interface CreateAgentModalProps
{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: CreateAgentRequest) => void;
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({ isOpen, onClose, onSubmit }) =>
{
    const [formData, setFormData] = useState<CreateAgentRequest>({
        personId: "",
        employeeId: "",
        groupId: "",
        status: AgentStatus.Available
    });

    const handleSubmit = (e: React.FormEvent) =>
    {
        e.preventDefault();
        onSubmit(formData);
    };

    if (!isOpen)
        return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <h2 className="text-2xl font-bold mb-4">Create New Agent</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Person ID
                        </label>
                        <input
                            type="text"
                            required
                            value={formData.personId}
                            onChange={(e) => setFormData(prev => ({ ...prev, personId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter person ID"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Employee ID (Optional)
                        </label>
                        <input
                            type="text"
                            value={formData.employeeId}
                            onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter employee ID"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Group
                        </label>
                        <select
                            aria-label="Agent group"
                            value={formData.groupId}
                            onChange={(e) => setFormData(prev => ({ ...prev, groupId: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            <option value="">Select Group</option>
                            <option value="group1">Sales Team</option>
                            <option value="group2">Technical Support</option>
                            <option value="group3">Customer Service</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Initial Status
                        </label>
                        <select
                            aria-label="Agent status"
                            value={formData.status}
                            onChange={(e) => setFormData(prev => ({ ...prev, status: parseInt(e.target.value) }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {Object.entries(AgentStatus)
                                .filter(([key]) => isNaN(Number(key)))
                                .map(([key, value]) => (
                                    <option key={value} value={value}>
                                        {key}
                                    </option>
                                ))}
                        </select>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium">
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md font-medium">
                            Create Agent
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};