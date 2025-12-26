import { getWithAuth } from "./httpClient";

export interface AgentChatReport {
    agentName: string;
    totalChats: number;
    averageDailyChat: number;
}

export interface AiRequestReport {
    date: string;
    count: number;
}

export interface ChatSentimentReport {
    date: string;
    agentName: string;
    totalChats: number;
    positiveCustomerTone: number;
    negativeCustomerTone: number;
    neutralCustomerTone: number;
}

export interface WordFrequencyReport {
    keyword: string;
    totalUsage: number;
}

export interface ReportSummary {
    period: {
        start: string;
        end: string;
    };
    totalAgentChats: number;
    totalAiRequests: number;
    totalChats: number;
    uniqueAgents: number;
    positiveSentimentCount: number;
    positiveSentimentPercentage: number;
    activeAgentCount: number;
    activeCustomerCount: number;
}

export interface DashboardData {
    activeAgentCount: number;
    activeCustomerCount: number;
    totalAgents: number;
    availableAgents: number;
    uniqueAgentsLast30Days: number;
    today: {
        agentChats: number;
        aiRequests: number;
        messages: number;
        chatsCreated: number;
    };
    last7Days: {
        agentChats: number;
        aiRequests: number;
        messages: number;
        chatsCreated: number;
        averageDailyChats: number;
    };
    last30Days: {
        agentChats: number;
        aiRequests: number;
        messages: number;
        totalChats: number;
        positiveSentimentPercentage: number;
        negativeSentimentPercentage: number;
        positiveChats: number;
        negativeChats: number;
        averageDailyChats: number;
    };
    dailyChartData: Array<{
        date: string;
        dayName: string;
        agentChats: number;
        aiRequests: number;
        messages: number;
    }>;
    hourlyActivity: Array<{
        hour: number;
        hourLabel: string;
        chats: number;
        messages: number;
    }>;
    topAgents: Array<{
        agentId: number;
        agentName: string;
        totalChats: number;
    }>;
    topKeywords: Array<{
        keyword: string;
        totalUsage: number;
    }>;
    weekOverWeekChange: number;
    thisWeekChats: number;
    lastWeekChats: number;
    lastHour: {
        agentChatSuccess: Array<{
            agentName: string;
            chatCount: number;
        }>;
        aiRequests: Array<{
            agentName: string;
            chatId: string;
            requestCount: number;
        }>;
        chatSentiments: Array<{
            agentName: string;
            chatId: number;
            customerOverallTone: string;
            agentOverallTone: string;
        }>;
        wordFrequencies: Array<{
            keyword: string;
            usageCount: number;
        }>;
    };
}

export interface ActiveAgentReport {
    agentId: number;
    agentName: string;
    totalActiveDays: number;
    totalChats: number;
    averageDailyChats: number;
}

export interface AgentPerformanceReport {
    agentId: number;
    agentName: string;
    totalChats: number;
    averageDailyChats: number;
    maxDailyChats: number;
    minDailyChats: number;
    activeDays: number;
}

export interface AgentAvailabilityReport {
    totalAgents: number;
    availableAgents: number;
    busyAgents: number;
    awayAgents: number;
    agents: Array<{
        agentId: string;
        agentName: string;
        status: string;
        isAvailable: boolean;
        isActive: boolean;
        lastActivityAt: string | null;
    }>;
}

export interface HourlyActivityReport {
    hour: number;
    hourLabel: string;
    chats: number;
    messages: number;
}

export interface DailyActivityReport {
    date: string;
    dayName: string;
    chats: number;
    messages: number;
    agentChats: number;
    aiRequests: number;
}

export interface WeeklyActivityReport {
    year: number;
    week: number;
    weekLabel: string;
    totalChats: number;
    averageDailyChats: number;
    uniqueAgents: number;
}

export interface SentimentTrendReport {
    date: string;
    totalChats: number;
    positiveCount: number;
    negativeCount: number;
    neutralCount: number;
    positivePercentage: number;
}

export interface AiUsageTrendReport {
    date: string;
    totalRequests: number;
    averageRequests: number;
}

export interface TopAgentReport {
    agentId: number;
    agentName: string;
    totalChats: number;
    averageDailyChats: number;
    maxDailyChats: number;
    activeDays: number;
}

export interface ChatCompletionRateReport {
    totalChats: number;
    completedChats: number;
    completionRate: number;
    incompleteChats: number;
}

export interface AgentSentimentAnalysisReport {
    agentId: number;
    agentName: string;
    totalChats: number;
    positiveSentimentCount: number;
    negativeSentimentCount: number;
    neutralSentimentCount: number;
    positivePercentage: number;
}

export interface MessageStatisticsReport {
    totalMessages: number;
    totalChats: number;
    averageMessagesPerChat: number;
    messagesByDay: Array<{
        date: string;
        messageCount: number;
    }>;
}

export interface CustomerSatisfactionReport {
    totalChats: number;
    positiveChats: number;
    negativeChats: number;
    neutralChats: number;
    satisfactionScore: number;
    positivePercentage: number;
    negativePercentage: number;
}

export interface PeakHoursReport {
    hourlyStats: Array<{
        hour: number;
        hourLabel: string;
        chats: number;
        messages: number;
        totalActivity: number;
    }>;
    peakHour: {
        hour: number;
        hourLabel: string;
        chats: number;
        messages: number;
        totalActivity: number;
    };
}

export interface AgentComparisonReport {
    agents: Array<{
        agentId: number;
        agentName: string;
        totalChats: number;
        averageDailyChats: number;
        maxDailyChats: number;
        minDailyChats: number;
        activeDays: number;
        consistency: number;
    }>;
    overallAverageDailyChats: number;
    totalAgents: number;
    aboveAverageAgents: number;
    belowAverageAgents: number;
}

export const reportApiClient = {
    getAgentChatsDaily: async (): Promise<AgentChatReport[]> => {
        return await getWithAuth<AgentChatReport[]>("/api/Report/agent-chats/daily") ?? [];
    },

    getAgentChatsWeekly: async (): Promise<AgentChatReport[]> => {
        return await getWithAuth<AgentChatReport[]>("/api/Report/agent-chats/weekly") ?? [];
    },

    getAgentChatsMonthly: async (): Promise<AgentChatReport[]> => {
        return await getWithAuth<AgentChatReport[]>("/api/Report/agent-chats/monthly") ?? [];
    },

    getAgentChats: async (startDate?: Date, endDate?: Date): Promise<AgentChatReport[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<AgentChatReport[]>(`/api/Report/agent-chats${query}`) ?? [];
    },

    getAiRequests: async (startDate?: Date, endDate?: Date): Promise<AiRequestReport[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<AiRequestReport[]>(`/api/Report/ai-requests${query}`) ?? [];
    },

    getChatSentiments: async (startDate?: Date, endDate?: Date, agentId?: number): Promise<ChatSentimentReport[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        if (agentId !== undefined) params.append("agentId", agentId.toString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<ChatSentimentReport[]>(`/api/Report/chat-sentiments${query}`) ?? [];
    },

    getWordFrequencies: async (startDate?: Date, endDate?: Date, topN?: number): Promise<WordFrequencyReport[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        if (topN !== undefined) params.append("topN", topN.toString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<WordFrequencyReport[]>(`/api/Report/word-frequencies${query}`) ?? [];
    },

    getSummary: async (startDate?: Date, endDate?: Date): Promise<ReportSummary | null> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<ReportSummary>(`/api/Report/summary${query}`);
    },

    getDashboardData: async (): Promise<DashboardData | null> => {
        return await getWithAuth<DashboardData>("/api/Dashboard");
    },

    getActiveAgents: async (startDate?: Date, endDate?: Date): Promise<ActiveAgentReport[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<ActiveAgentReport[]>(`/api/Report/active-agents${query}`) ?? [];
    },

    getAgentPerformance: async (startDate?: Date, endDate?: Date, topN?: number): Promise<AgentPerformanceReport[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        if (topN !== undefined) params.append("topN", topN.toString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<AgentPerformanceReport[]>(`/api/Report/agent-performance${query}`) ?? [];
    },

    getAgentAvailability: async (): Promise<AgentAvailabilityReport | null> => {
        return await getWithAuth<AgentAvailabilityReport>("/api/Report/agent-availability");
    },

    getHourlyActivity: async (date?: Date): Promise<HourlyActivityReport[]> => {
        const params = new URLSearchParams();
        if (date) params.append("date", date.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<HourlyActivityReport[]>(`/api/Report/hourly-activity${query}`) ?? [];
    },

    getDailyActivity: async (startDate?: Date, endDate?: Date): Promise<DailyActivityReport[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<DailyActivityReport[]>(`/api/Report/daily-activity${query}`) ?? [];
    },

    getWeeklyActivity: async (startDate?: Date, endDate?: Date): Promise<WeeklyActivityReport[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<WeeklyActivityReport[]>(`/api/Report/weekly-activity${query}`) ?? [];
    },

    getSentimentTrend: async (startDate?: Date, endDate?: Date): Promise<SentimentTrendReport[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<SentimentTrendReport[]>(`/api/Report/sentiment-trend${query}`) ?? [];
    },

    getAiUsageTrend: async (startDate?: Date, endDate?: Date): Promise<AiUsageTrendReport[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<AiUsageTrendReport[]>(`/api/Report/ai-usage-trend${query}`) ?? [];
    },

    getTopAgents: async (startDate?: Date, endDate?: Date, topN?: number): Promise<TopAgentReport[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        if (topN !== undefined) params.append("topN", topN.toString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<TopAgentReport[]>(`/api/Report/top-agents${query}`) ?? [];
    },

    getLeastActiveAgents: async (startDate?: Date, endDate?: Date, topN?: number): Promise<TopAgentReport[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        if (topN !== undefined) params.append("topN", topN.toString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<TopAgentReport[]>(`/api/Report/least-active-agents${query}`) ?? [];
    },

    getChatCompletionRate: async (startDate?: Date, endDate?: Date): Promise<ChatCompletionRateReport | null> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<ChatCompletionRateReport>(`/api/Report/chat-completion-rate${query}`);
    },

    getAgentSentimentAnalysis: async (startDate?: Date, endDate?: Date): Promise<AgentSentimentAnalysisReport[]> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<AgentSentimentAnalysisReport[]>(`/api/Report/agent-sentiment-analysis${query}`) ?? [];
    },

    getMessageStatistics: async (startDate?: Date, endDate?: Date): Promise<MessageStatisticsReport | null> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<MessageStatisticsReport>(`/api/Report/message-statistics${query}`);
    },

    getCustomerSatisfaction: async (startDate?: Date, endDate?: Date): Promise<CustomerSatisfactionReport | null> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<CustomerSatisfactionReport>(`/api/Report/customer-satisfaction${query}`);
    },

    getPeakHours: async (startDate?: Date, endDate?: Date): Promise<PeakHoursReport | null> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<PeakHoursReport>(`/api/Report/peak-hours${query}`);
    },

    getAgentComparison: async (startDate?: Date, endDate?: Date): Promise<AgentComparisonReport | null> => {
        const params = new URLSearchParams();
        if (startDate) params.append("startDate", startDate.toISOString());
        if (endDate) params.append("endDate", endDate.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<AgentComparisonReport>(`/api/Report/agent-comparison${query}`);
    },

    getDailyAgentChatSuccess: async (date?: Date): Promise<Array<{ date: string; agentName: string; chatCount: number }>> => {
        const params = new URLSearchParams();
        if (date) params.append("date", date.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<Array<{ date: string; agentName: string; chatCount: number }>>(`/api/Report/daily-agent-chat-success${query}`) ?? [];
    },

    getDailyAiRequests: async (date?: Date): Promise<Array<{ date: string; agentName: string; chatId: string; requestCount: number }>> => {
        const params = new URLSearchParams();
        if (date) params.append("date", date.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<Array<{ date: string; agentName: string; chatId: string; requestCount: number }>>(`/api/Report/daily-ai-requests${query}`) ?? [];
    },

    getDailyChatSentimentDetailed: async (date?: Date): Promise<Array<{ date: string; agentName: string; chatId: number; customerOverallTone: string; agentOverallTone: string }>> => {
        const params = new URLSearchParams();
        if (date) params.append("date", date.toISOString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<Array<{ date: string; agentName: string; chatId: number; customerOverallTone: string; agentOverallTone: string }>>(`/api/Report/daily-chat-sentiment-detailed${query}`) ?? [];
    },

    getDailyWordFrequencyDetailed: async (date?: Date, topN?: number): Promise<Array<{ date: string; keyword: string; usageCount: number }>> => {
        const params = new URLSearchParams();
        if (date) params.append("date", date.toISOString());
        if (topN !== undefined) params.append("topN", topN.toString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<Array<{ date: string; keyword: string; usageCount: number }>>(`/api/Report/daily-word-frequency-detailed${query}`) ?? [];
    },

    getHourlyAgentChatSuccess: async (): Promise<Array<{ agentName: string; chatCount: number }>> => {
        return await getWithAuth<Array<{ agentName: string; chatCount: number }>>("/api/Report/hourly-agent-chat-success") ?? [];
    },

    getHourlyAiRequests: async (): Promise<Array<{ agentName: string; chatId: string; requestCount: number }>> => {
        return await getWithAuth<Array<{ agentName: string; chatId: string; requestCount: number }>>("/api/Report/hourly-ai-requests") ?? [];
    },

    getHourlyChatSentiment: async (): Promise<Array<{ agentName: string; chatId: number; customerOverallTone: string; agentOverallTone: string }>> => {
        return await getWithAuth<Array<{ agentName: string; chatId: number; customerOverallTone: string; agentOverallTone: string }>>("/api/Report/hourly-chat-sentiment") ?? [];
    },

    getHourlyWordFrequency: async (topN?: number): Promise<Array<{ keyword: string; usageCount: number }>> => {
        const params = new URLSearchParams();
        if (topN !== undefined) params.append("topN", topN.toString());
        const query = params.toString() ? `?${params.toString()}` : "";
        return await getWithAuth<Array<{ keyword: string; usageCount: number }>>(`/api/Report/hourly-word-frequency${query}`) ?? [];
    }
};

