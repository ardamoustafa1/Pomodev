import React from "react";
import { AgentStatus } from "../../lib/Models"
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FilterX, Users, UserCheck } from "lucide-react";

interface AgentFiltersProps {
  onFilterChange: (filters: { groupId?: string; status?: string }) => void;
}

export const AgentFilters: React.FC<AgentFiltersProps> = ({ onFilterChange }) => {
  const [localFilters, setLocalFilters] = React.useState({
    groupId: "",
    status: ""
  });

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  const clearFilters = () => {
    const resetFilters = { groupId: "", status: "" };
    setLocalFilters(resetFilters);
    onFilterChange(resetFilters);
  };

  const hasActiveFilters = localFilters.groupId || localFilters.status;

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Select
        value={localFilters.groupId}
        onValueChange={(value) => handleFilterChange("groupId", value)}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <Users className="h-4 w-4 mr-2" />
          <SelectValue placeholder="All Groups" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Groups</SelectItem>
          <SelectItem value="sales">Sales Team</SelectItem>
          <SelectItem value="technical">Technical Support</SelectItem>
          <SelectItem value="support">Customer Service</SelectItem>
          <SelectItem value="vip">VIP Support</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={localFilters.status}
        onValueChange={(value) => handleFilterChange("status", value)}
      >
        <SelectTrigger className="w-full sm:w-[180px]">
          <UserCheck className="h-4 w-4 mr-2" />
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="">All Statuses</SelectItem>
          {Object.entries(AgentStatus)
            .filter(([key]) => isNaN(Number(key)))
            .map(([key, value]) => (
              <SelectItem key={value} value={value.toString()}>
                {key}
              </SelectItem>
            ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="outline"
          onClick={clearFilters}
          className="gap-2"
        >
          <FilterX className="h-4 w-4" />
          Clear
        </Button>
      )}
    </div>
  );
};