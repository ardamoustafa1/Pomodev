import React from "react";
import { AgentStatus, type Agent } from "../../lib/Models"
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Mail, 
  Phone, 
  Users, 
  Award, 
  MoreVertical,
  Trash2,
  Edit
} from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AgentCardProps {
  agent: Agent;
  onStatusChange: (agentId: string, status: AgentStatus) => void;
  onDelete: (agentId: string) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({ agent, onStatusChange, onDelete }) => {
  const getStatusVariant = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.Available: return "default";
      case AgentStatus.Busy: return "destructive";
      case AgentStatus.OnBreak: return "secondary";
      case AgentStatus.Training: return "outline";
      case AgentStatus.Away: return "outline";
      default: return "outline";
    }
  };

  const getStatusColor = (status: AgentStatus) => {
    switch (status) {
      case AgentStatus.Available: return "text-green-600";
      case AgentStatus.Busy: return "text-red-600";
      case AgentStatus.OnBreak: return "text-yellow-600";
      case AgentStatus.Training: return "text-blue-600";
      case AgentStatus.Away: return "text-gray-600";
      default: return "text-gray-600";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={agent.avatarUrl} alt={agent.name} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(agent.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg leading-tight">{agent.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={getStatusVariant(agent.status)} className={getStatusColor(agent.status)}>
                  {AgentStatus[agent.status]}
                </Badge>
                {agent.employeeId && (
                  <span className="text-xs text-muted-foreground">#{agent.employeeId}</span>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(agent.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{agent.email}</span>
          </div>
          {agent.phoneNumber && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{agent.phoneNumber}</span>
            </div>
          )}
          {agent.groupName && (
            <div className="flex items-center gap-2 text-sm">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{agent.groupName}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Award className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{agent.skillCount}</span>
              <span className="text-muted-foreground">skills</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{agent.activeQueueCount}</span>
              <span className="text-muted-foreground">queues</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Select
            value={agent.status.toString()}
            onValueChange={(value) => onStatusChange(agent.id, parseInt(value))}
          >
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(AgentStatus)
                .filter(([key]) => isNaN(Number(key)))
                .map(([key, value]) => (
                  <SelectItem key={value} value={value.toString()}>
                    {key}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};