import { useState } from "react"
import { AgentStatus } from "../../lib/Models"

export const AgentFilters = ({ onFilterChange }: {
    onFilterChange: (filters: { groupId?: string; status?: string }) => void;
}) =>
{
    const [localFilters, setLocalFilters] = useState({
        groupId: "",
        status: ""
    });

    const handleFilterChange = (key: string, value: string) =>
    {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        onFilterChange(newFilters);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Group
                    </label>
                    <select
                        aria-label="Agent group"
                        value={localFilters.groupId}
                        onChange={(e) => handleFilterChange("groupId", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Groups</option>
                        {/* Groups would be loaded from API */}
                        <option value="group1">Sales Team</option>
                        <option value="group2">Technical Support</option>
                        <option value="group3">Customer Service</option>
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                    </label>
                    <select
                        aria-label="Agent status"
                        value={localFilters.status}
                        onChange={(e) => handleFilterChange("status", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        <option value="">All Statuses</option>
                        {Object.entries(AgentStatus)
                            .filter(([key]) => isNaN(Number(key)))
                            .map(([key, value]) => (
                                <option key={value} value={value}>
                                    {key}
                                </option>
                            ))}
                    </select>
                </div>

                <div className="flex items-end">
                    <button
                        onClick={() =>
                        {
                            const resetFilters = { groupId: "", status: "" };
                            setLocalFilters(resetFilters);
                            onFilterChange(resetFilters);
                        }}
                        className="w-full px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md font-medium">
                        Clear Filters
                    </button>
                </div>
            </div>
        </div>
    );
};