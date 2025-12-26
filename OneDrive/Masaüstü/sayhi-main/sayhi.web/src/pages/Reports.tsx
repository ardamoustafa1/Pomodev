import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CalendarIcon, DownloadIcon, TrendingUpIcon, MessageSquareIcon, BotIcon, BarChart3Icon, FileTextIcon, UsersIcon, ClockIcon, ActivityIcon, TrendingDownIcon, AwardIcon } from "lucide-react";
import { reportApiClient, type AgentChatReport, type AiRequestReport, type ChatSentimentReport, type WordFrequencyReport, type ReportSummary, type ActiveAgentReport, type AgentPerformanceReport, type AgentAvailabilityReport, type HourlyActivityReport, type DailyActivityReport, type WeeklyActivityReport, type SentimentTrendReport, type AiUsageTrendReport, type TopAgentReport, type ChatCompletionRateReport, type AgentSentimentAnalysisReport, type MessageStatisticsReport, type CustomerSatisfactionReport, type PeakHoursReport, type AgentComparisonReport } from "@/lib/reportApiClient";
import { format } from "date-fns";

const Reports = () => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("summary");
    
    // Date filters
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    
    // Data states
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [agentChats, setAgentChats] = useState<AgentChatReport[]>([]);
    const [aiRequests, setAiRequests] = useState<AiRequestReport[]>([]);
    const [chatSentiments, setChatSentiments] = useState<ChatSentimentReport[]>([]);
    const [wordFrequencies, setWordFrequencies] = useState<WordFrequencyReport[]>([]);
    const [activeAgents, setActiveAgents] = useState<ActiveAgentReport[]>([]);
    const [agentPerformance, setAgentPerformance] = useState<AgentPerformanceReport[]>([]);
    const [agentAvailability, setAgentAvailability] = useState<AgentAvailabilityReport | null>(null);
    const [hourlyActivity, setHourlyActivity] = useState<HourlyActivityReport[]>([]);
    const [dailyActivity, setDailyActivity] = useState<DailyActivityReport[]>([]);
    const [weeklyActivity, setWeeklyActivity] = useState<WeeklyActivityReport[]>([]);
    const [sentimentTrend, setSentimentTrend] = useState<SentimentTrendReport[]>([]);
    const [aiUsageTrend, setAiUsageTrend] = useState<AiUsageTrendReport[]>([]);
    const [topAgents, setTopAgents] = useState<TopAgentReport[]>([]);
    const [leastActiveAgents, setLeastActiveAgents] = useState<TopAgentReport[]>([]);
    const [chatCompletionRate, setChatCompletionRate] = useState<ChatCompletionRateReport | null>(null);
    const [agentSentimentAnalysis, setAgentSentimentAnalysis] = useState<AgentSentimentAnalysisReport[]>([]);
    const [messageStatistics, setMessageStatistics] = useState<MessageStatisticsReport | null>(null);
    const [customerSatisfaction, setCustomerSatisfaction] = useState<CustomerSatisfactionReport | null>(null);
    const [peakHours, setPeakHours] = useState<PeakHoursReport | null>(null);
    const [agentComparison, setAgentComparison] = useState<AgentComparisonReport | null>(null);
    const [dailyAgentChatSuccess, setDailyAgentChatSuccess] = useState<Array<{ date: string; agentName: string; chatCount: number }>>([]);
    const [dailyAiRequests, setDailyAiRequests] = useState<Array<{ date: string; agentName: string; chatId: string; requestCount: number }>>([]);
    const [dailyChatSentimentDetailed, setDailyChatSentimentDetailed] = useState<Array<{ date: string; agentName: string; chatId: number; customerOverallTone: string; agentOverallTone: string }>>([]);
    const [dailyWordFrequencyDetailed, setDailyWordFrequencyDetailed] = useState<Array<{ date: string; keyword: string; usageCount: number }>>([]);

    useEffect(() => {
        const today = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(today.getDate() - 30);
        setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
        setEndDate(today.toISOString().split('T')[0]);
    }, []);

    const loadSummary = async () => {
        setLoading(true);
        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const data = await reportApiClient.getSummary(start, end);
            setSummary(data);
        } catch (error) {
            console.error("Error loading summary:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadAgentChats = async (period?: "daily" | "weekly" | "monthly") => {
        setLoading(true);
        try {
            let data: AgentChatReport[] = [];
            if (period === "daily") {
                data = await reportApiClient.getAgentChatsDaily();
            } else if (period === "weekly") {
                data = await reportApiClient.getAgentChatsWeekly();
            } else if (period === "monthly") {
                data = await reportApiClient.getAgentChatsMonthly();
            } else {
                const start = startDate ? new Date(startDate) : undefined;
                const end = endDate ? new Date(endDate) : undefined;
                data = await reportApiClient.getAgentChats(start, end);
            }
            setAgentChats(data);
        } catch (error) {
            console.error("Error loading agent chats:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadAiRequests = async () => {
        setLoading(true);
        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const data = await reportApiClient.getAiRequests(start, end);
            setAiRequests(data);
        } catch (error) {
            console.error("Error loading AI requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadChatSentiments = async () => {
        setLoading(true);
        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const data = await reportApiClient.getChatSentiments(start, end);
            setChatSentiments(data);
        } catch (error) {
            console.error("Error loading chat sentiments:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadWordFrequencies = async () => {
        setLoading(true);
        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const data = await reportApiClient.getWordFrequencies(start, end, 20);
            setWordFrequencies(data);
        } catch (error) {
            console.error("Error loading word frequencies:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadAgentPerformance = async () => {
        setLoading(true);
        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const data = await reportApiClient.getAgentPerformance(start, end, 20);
            setAgentPerformance(data);
        } catch (error) {
            console.error("Error loading agent performance:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadHourlyActivity = async () => {
        setLoading(true);
        try {
            const data = await reportApiClient.getHourlyActivity();
            setHourlyActivity(data);
        } catch (error) {
            console.error("Error loading hourly activity:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadTopAgents = async () => {
        setLoading(true);
        try {
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            const data = await reportApiClient.getTopAgents(start, end, 10);
            setTopAgents(data);
        } catch (error) {
            console.error("Error loading top agents:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadDailyAgentChatSuccess = async () => {
        setLoading(true);
        try {
            const date = endDate ? new Date(endDate) : new Date();
            const data = await reportApiClient.getDailyAgentChatSuccess(date);
            setDailyAgentChatSuccess(data);
        } catch (error) {
            console.error("Error loading daily agent chat success:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadDailyAiRequests = async () => {
        setLoading(true);
        try {
            const date = endDate ? new Date(endDate) : new Date();
            const data = await reportApiClient.getDailyAiRequests(date);
            setDailyAiRequests(data);
        } catch (error) {
            console.error("Error loading daily AI requests:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadDailyChatSentimentDetailed = async () => {
        setLoading(true);
        try {
            const date = endDate ? new Date(endDate) : new Date();
            const data = await reportApiClient.getDailyChatSentimentDetailed(date);
            setDailyChatSentimentDetailed(data);
        } catch (error) {
            console.error("Error loading daily chat sentiment detailed:", error);
        } finally {
            setLoading(false);
        }
    };

    const loadDailyWordFrequencyDetailed = async () => {
        setLoading(true);
        try {
            const date = endDate ? new Date(endDate) : new Date();
            const data = await reportApiClient.getDailyWordFrequencyDetailed(date, 50);
            setDailyWordFrequencyDetailed(data);
        } catch (error) {
            console.error("Error loading daily word frequency detailed:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === "summary") {
            loadSummary();
        } else if (activeTab === "agent-chats") {
            loadAgentChats();
        } else if (activeTab === "ai-requests") {
            loadAiRequests();
        } else if (activeTab === "sentiments") {
            loadChatSentiments();
        } else if (activeTab === "keywords") {
            loadWordFrequencies();
        } else if (activeTab === "agent-performance") {
            loadAgentPerformance();
        } else if (activeTab === "hourly-activity") {
            loadHourlyActivity();
        } else if (activeTab === "top-agents") {
            loadTopAgents();
        } else if (activeTab === "daily-agent-success") {
            loadDailyAgentChatSuccess();
        } else if (activeTab === "daily-ai-detailed") {
            loadDailyAiRequests();
        } else if (activeTab === "daily-sentiment-detailed") {
            loadDailyChatSentimentDetailed();
        } else if (activeTab === "daily-keywords-detailed") {
            loadDailyWordFrequencyDetailed();
        }
    }, [activeTab, startDate, endDate]);

    const handleApplyFilters = () => {
        if (activeTab === "summary") {
            loadSummary();
        } else if (activeTab === "agent-chats") {
            loadAgentChats();
        } else if (activeTab === "ai-requests") {
            loadAiRequests();
        } else if (activeTab === "sentiments") {
            loadChatSentiments();
        } else if (activeTab === "keywords") {
            loadWordFrequencies();
        } else if (activeTab === "agent-performance") {
            loadAgentPerformance();
        } else if (activeTab === "hourly-activity") {
            loadHourlyActivity();
        } else if (activeTab === "top-agents") {
            loadTopAgents();
        } else if (activeTab === "daily-agent-success") {
            loadDailyAgentChatSuccess();
        } else if (activeTab === "daily-ai-detailed") {
            loadDailyAiRequests();
        } else if (activeTab === "daily-sentiment-detailed") {
            loadDailyChatSentimentDetailed();
        } else if (activeTab === "daily-keywords-detailed") {
            loadDailyWordFrequencyDetailed();
        }
    };

    return (
        <ScrollArea className="h-full">
            <main className="p-4 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Raporlar</h1>
                        <p className="text-gray-500 mt-1">Detaylı analiz ve istatistikler</p>
                    </div>
                    <Button variant="outline">
                        <DownloadIcon className="h-4 w-4 mr-2" />
                        Rapor İndir
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Tarih Filtreleri</CardTitle>
                        <CardDescription>Raporlar için tarih aralığı seçin</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1">
                                <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div className="flex-1">
                                <Label htmlFor="endDate">Bitiş Tarihi</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <Button onClick={handleApplyFilters} disabled={loading}>
                                <CalendarIcon className="h-4 w-4 mr-2" />
                                Uygula
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 lg:grid-cols-6 xl:grid-cols-9">
                        <TabsTrigger value="summary">Özet</TabsTrigger>
                        <TabsTrigger value="agent-chats">Agent Sohbetleri</TabsTrigger>
                        <TabsTrigger value="ai-requests">AI İstekleri</TabsTrigger>
                        <TabsTrigger value="sentiments">Duygu Analizi</TabsTrigger>
                        <TabsTrigger value="keywords">Anahtar Kelimeler</TabsTrigger>
                        <TabsTrigger value="daily-agent-success">Günlük Agent Başarısı</TabsTrigger>
                        <TabsTrigger value="daily-ai-detailed">Günlük AI Detay</TabsTrigger>
                        <TabsTrigger value="daily-sentiment-detailed">Günlük Duygu Detay</TabsTrigger>
                        <TabsTrigger value="daily-keywords-detailed">Günlük Kelime Detay</TabsTrigger>
                    </TabsList>

                    <TabsContent value="summary" className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8">Yükleniyor...</div>
                        ) : summary ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Toplam Agent Sohbetleri</CardTitle>
                                        <MessageSquareIcon className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{summary.totalAgentChats}</div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {format(new Date(summary.period.start), "dd MMM yyyy")} - {format(new Date(summary.period.end), "dd MMM yyyy")}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Toplam AI İstekleri</CardTitle>
                                        <BotIcon className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{summary.totalAiRequests}</div>
                                        <p className="text-xs text-gray-500 mt-1">AI kullanım sayısı</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Toplam Sohbetler</CardTitle>
                                        <BarChart3Icon className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{summary.totalChats}</div>
                                        <p className="text-xs text-gray-500 mt-1">Tüm sohbetler</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Pozitif Duygu Oranı</CardTitle>
                                        <TrendingUpIcon className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{summary.positiveSentimentPercentage.toFixed(1)}%</div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {summary.positiveSentimentCount} / {summary.totalChats} sohbet
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Aktif Agentler</CardTitle>
                                        <MessageSquareIcon className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{summary.activeAgentCount}</div>
                                        <p className="text-xs text-gray-500 mt-1">Şu anda aktif</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Aktif Müşteriler</CardTitle>
                                        <MessageSquareIcon className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{summary.activeCustomerCount}</div>
                                        <p className="text-xs text-gray-500 mt-1">Şu anda aktif</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">Benzersiz Agentler</CardTitle>
                                        <FileTextIcon className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">{summary.uniqueAgents}</div>
                                        <p className="text-xs text-gray-500 mt-1">Farklı agent sayısı</p>
                                    </CardContent>
                                </Card>
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Veri bulunamadı</div>
                        )}
                    </TabsContent>

                    <TabsContent value="agent-chats" className="space-y-4">
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => loadAgentChats("daily")}>Günlük</Button>
                            <Button variant="outline" size="sm" onClick={() => loadAgentChats("weekly")}>Haftalık</Button>
                            <Button variant="outline" size="sm" onClick={() => loadAgentChats("monthly")}>Aylık</Button>
                        </div>
                        {loading ? (
                            <div className="text-center py-8">Yükleniyor...</div>
                        ) : agentChats.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Agent Sohbet Raporu</CardTitle>
                                    <CardDescription>Agent bazlı sohbet istatistikleri</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Agent Adı</TableHead>
                                                <TableHead>Toplam Sohbet</TableHead>
                                                <TableHead>Ortalama Günlük Sohbet</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {agentChats.map((report, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{report.agentName}</TableCell>
                                                    <TableCell>{report.totalChats}</TableCell>
                                                    <TableCell>{report.averageDailyChat}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Veri bulunamadı</div>
                        )}
                    </TabsContent>

                    <TabsContent value="ai-requests" className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8">Yükleniyor...</div>
                        ) : aiRequests.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>AI İstek Raporu</CardTitle>
                                    <CardDescription>Tarih bazlı AI istek istatistikleri</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tarih</TableHead>
                                                <TableHead>İstek Sayısı</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {aiRequests.map((report, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">
                                                        {format(new Date(report.date), "dd MMM yyyy")}
                                                    </TableCell>
                                                    <TableCell>{report.count}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Veri bulunamadı</div>
                        )}
                    </TabsContent>

                    <TabsContent value="sentiments" className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8">Yükleniyor...</div>
                        ) : chatSentiments.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Duygu Analizi Raporu</CardTitle>
                                    <CardDescription>Agent ve tarih bazlı duygu analizi</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Tarih</TableHead>
                                                <TableHead>Agent</TableHead>
                                                <TableHead>Toplam Sohbet</TableHead>
                                                <TableHead>Pozitif</TableHead>
                                                <TableHead>Negatif</TableHead>
                                                <TableHead>Nötr</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {chatSentiments.map((report, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        {format(new Date(report.date), "dd MMM yyyy")}
                                                    </TableCell>
                                                    <TableCell className="font-medium">{report.agentName}</TableCell>
                                                    <TableCell>{report.totalChats}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="default" className="bg-green-500">
                                                            {report.positiveCustomerTone}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="destructive">
                                                            {report.negativeCustomerTone}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary">
                                                            {report.neutralCustomerTone}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Veri bulunamadı</div>
                        )}
                    </TabsContent>

                    <TabsContent value="keywords" className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8">Yükleniyor...</div>
                        ) : wordFrequencies.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Anahtar Kelime Raporu</CardTitle>
                                    <CardDescription>En çok kullanılan kelimeler</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Kelime</TableHead>
                                                <TableHead>Kullanım Sayısı</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {wordFrequencies.map((report, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{report.keyword}</TableCell>
                                                    <TableCell>{report.totalUsage}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Veri bulunamadı</div>
                        )}
                    </TabsContent>

                    <TabsContent value="agent-performance" className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8">Yükleniyor...</div>
                        ) : agentPerformance.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Agent Performans Raporu</CardTitle>
                                    <CardDescription>Agent bazlı performans metrikleri</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Agent Adı</TableHead>
                                                <TableHead>Toplam Sohbet</TableHead>
                                                <TableHead>Ortalama Günlük</TableHead>
                                                <TableHead>Maksimum Günlük</TableHead>
                                                <TableHead>Minimum Günlük</TableHead>
                                                <TableHead>Aktif Günler</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {agentPerformance.map((report, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{report.agentName}</TableCell>
                                                    <TableCell>{report.totalChats}</TableCell>
                                                    <TableCell>{report.averageDailyChats}</TableCell>
                                                    <TableCell>{report.maxDailyChats}</TableCell>
                                                    <TableCell>{report.minDailyChats}</TableCell>
                                                    <TableCell>{report.activeDays}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Veri bulunamadı</div>
                        )}
                    </TabsContent>

                    <TabsContent value="hourly-activity" className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8">Yükleniyor...</div>
                        ) : hourlyActivity.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Saatlik Aktivite Raporu</CardTitle>
                                    <CardDescription>Günün saatlerine göre aktivite dağılımı</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Saat</TableHead>
                                                <TableHead>Sohbetler</TableHead>
                                                <TableHead>Mesajlar</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {hourlyActivity.map((report, index) => (
                                                <TableRow key={index}>
                                                    <TableCell className="font-medium">{report.hourLabel}</TableCell>
                                                    <TableCell>{report.chats}</TableCell>
                                                    <TableCell>{report.messages}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Veri bulunamadı</div>
                        )}
                    </TabsContent>

                    <TabsContent value="top-agents" className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8">Yükleniyor...</div>
                        ) : topAgents.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>En İyi Agentler</CardTitle>
                                    <CardDescription>En çok sohbet yapan agentler</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Sıra</TableHead>
                                                <TableHead>Agent Adı</TableHead>
                                                <TableHead>Toplam Sohbet</TableHead>
                                                <TableHead>Ortalama Günlük</TableHead>
                                                <TableHead>Maksimum Günlük</TableHead>
                                                <TableHead>Aktif Günler</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {topAgents.map((report, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <Badge variant="default">#{index + 1}</Badge>
                                                    </TableCell>
                                                    <TableCell className="font-medium">{report.agentName}</TableCell>
                                                    <TableCell>{report.totalChats}</TableCell>
                                                    <TableCell>{report.averageDailyChats}</TableCell>
                                                    <TableCell>{report.maxDailyChats}</TableCell>
                                                    <TableCell>{report.activeDays}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Veri bulunamadı</div>
                        )}
                    </TabsContent>

                    <TabsContent value="daily-agent-success" className="space-y-4">
                        <div className="flex gap-2 items-center">
                            <Label>Tarih Seç:</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    loadDailyAgentChatSuccess();
                                }}
                                className="w-48"
                            />
                        </div>
                        {loading ? (
                            <div className="text-center py-8">Yükleniyor...</div>
                        ) : dailyAgentChatSuccess.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Günlük Agent Bazlı Chat Başarı Raporu</CardTitle>
                                    <CardDescription>Seçilen güne göre agent bazlı chat adedi</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Gün</TableHead>
                                                <TableHead>Agent Adı</TableHead>
                                                <TableHead>Chat Adedi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dailyAgentChatSuccess.map((report, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{report.date}</TableCell>
                                                    <TableCell className="font-medium">{report.agentName}</TableCell>
                                                    <TableCell>{report.chatCount}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Veri bulunamadı</div>
                        )}
                    </TabsContent>

                    <TabsContent value="daily-ai-detailed" className="space-y-4">
                        <div className="flex gap-2 items-center">
                            <Label>Tarih Seç:</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    loadDailyAiRequests();
                                }}
                                className="w-48"
                            />
                        </div>
                        {loading ? (
                            <div className="text-center py-8">Yükleniyor...</div>
                        ) : dailyAiRequests.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Günlük AI Request Raporu</CardTitle>
                                    <CardDescription>Seçilen güne göre AI istek sayıları</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Gün</TableHead>
                                                <TableHead>Agent Adı</TableHead>
                                                <TableHead>Chat ID</TableHead>
                                                <TableHead>İstek Adedi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dailyAiRequests.map((report, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{report.date}</TableCell>
                                                    <TableCell className="font-medium">{report.agentName}</TableCell>
                                                    <TableCell className="text-xs">{report.chatId.substring(0, 8)}...</TableCell>
                                                    <TableCell>{report.requestCount}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Veri bulunamadı</div>
                        )}
                    </TabsContent>

                    <TabsContent value="daily-sentiment-detailed" className="space-y-4">
                        <div className="flex gap-2 items-center">
                            <Label>Tarih Seç:</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    loadDailyChatSentimentDetailed();
                                }}
                                className="w-48"
                            />
                        </div>
                        {loading ? (
                            <div className="text-center py-8">Yükleniyor...</div>
                        ) : dailyChatSentimentDetailed.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Günlük Chat Duygu Analizi Raporu</CardTitle>
                                    <CardDescription>Seçilen güne göre detaylı duygu analizi</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Gün</TableHead>
                                                <TableHead>Agent Adı</TableHead>
                                                <TableHead>Chat ID</TableHead>
                                                <TableHead>Müşteri Duygu Tonu</TableHead>
                                                <TableHead>Agent Duygu Tonu</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dailyChatSentimentDetailed.map((report, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{report.date}</TableCell>
                                                    <TableCell className="font-medium">{report.agentName}</TableCell>
                                                    <TableCell>{report.chatId}</TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            report.customerOverallTone.toLowerCase().includes("positive") || report.customerOverallTone.toLowerCase().includes("pozitif")
                                                                ? "default"
                                                                : report.customerOverallTone.toLowerCase().includes("negative") || report.customerOverallTone.toLowerCase().includes("negatif")
                                                                    ? "destructive"
                                                                    : "secondary"
                                                        }>
                                                            {report.customerOverallTone}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant={
                                                            report.agentOverallTone.toLowerCase().includes("positive") || report.agentOverallTone.toLowerCase().includes("pozitif")
                                                                ? "default"
                                                                : report.agentOverallTone.toLowerCase().includes("negative") || report.agentOverallTone.toLowerCase().includes("negatif")
                                                                    ? "destructive"
                                                                    : "secondary"
                                                        }>
                                                            {report.agentOverallTone}
                                                        </Badge>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Veri bulunamadı</div>
                        )}
                    </TabsContent>

                    <TabsContent value="daily-keywords-detailed" className="space-y-4">
                        <div className="flex gap-2 items-center">
                            <Label>Tarih Seç:</Label>
                            <Input
                                type="date"
                                value={endDate}
                                onChange={(e) => {
                                    setEndDate(e.target.value);
                                    loadDailyWordFrequencyDetailed();
                                }}
                                className="w-48"
                            />
                        </div>
                        {loading ? (
                            <div className="text-center py-8">Yükleniyor...</div>
                        ) : dailyWordFrequencyDetailed.length > 0 ? (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Günlük En Çok Kullanılan Kelime Raporu</CardTitle>
                                    <CardDescription>Seçilen güne göre kelime kullanım istatistikleri</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Gün</TableHead>
                                                <TableHead>Anahtar Kelime</TableHead>
                                                <TableHead>Kullanım Adedi</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {dailyWordFrequencyDetailed.map((report, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{report.date}</TableCell>
                                                    <TableCell className="font-medium">{report.keyword}</TableCell>
                                                    <TableCell>{report.usageCount}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="text-center py-8 text-gray-500">Veri bulunamadı</div>
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </ScrollArea>
    );
};

export default Reports;

