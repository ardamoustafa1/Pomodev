import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { DollarSignIcon, UsersIcon, CreditCardIcon, ActivityIcon, CalendarIcon, TrendingUpIcon, TrendingDownIcon, MessageSquareIcon, BotIcon, BarChart3Icon, AwardIcon } from "lucide-react"
import { reportApiClient, type DashboardData } from "@/lib/reportApiClient"



const StatCard = ({ title, value, change, description, icon: Icon }: {
    title: string;
    value: string;
    change: string;
    description?: string;
    icon: React.ComponentType<any>;
}) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-gray-500" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {description && (
                <p className="text-xs text-gray-500 mt-1">
                    {change && (
                        <>
                            {change.startsWith("+")
                                ? <TrendingUpIcon className="h-4 w-4 text-green-600 mr-1 inline" />
                                : change.startsWith("-")
                                    ? <TrendingDownIcon className="h-4 w-4 text-red-600 mr-1 inline" />
                                    : null}
                            <span className={change.startsWith("+") ? "text-green-600 font-semibold" : change.startsWith("-") ? "text-red-600 font-semibold" : ""}>{change}</span>
                            {change && <span className="mx-2">•</span>}
                        </>
                    )}
                    {description}
                </p>
            )}
        </CardContent>
    </Card>
);

const OverviewChart = ({ className, chartData }: { className?: string | undefined; chartData: Array<{ date: string; dayName: string; agentChats: number; aiRequests: number }> }) => {
    const maxValue = Math.max(...chartData.map(d => Math.max(d.agentChats, d.aiRequests)), 1);
    
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Son 7 Gün Aktivite</CardTitle>
                <CardDescription>Günlük agent sohbetleri ve AI istekleri</CardDescription>
            </CardHeader>
            <CardContent className="h-[350px]">
                <div className="h-full w-full flex items-end space-x-2 p-4 pt-10">
                    {chartData.map((d, index) => (
                        <div
                            key={index}
                            className="flex flex-col items-center justify-end h-full flex-1 space-y-1">
                            {/* Agent Chats Bar */}
                            <div
                                className="bg-blue-600/70 hover:bg-blue-600 rounded-t-sm transition-all w-full"
                                style={{ height: `${(d.agentChats / maxValue) * 100}%` }}
                                title={`${d.dayName}: ${d.agentChats} sohbet`}
                            />
                            {/* AI Requests Bar */}
                            <div
                                className="bg-green-600/70 hover:bg-green-600 rounded-t-sm transition-all w-full"
                                style={{ height: `${(d.aiRequests / maxValue) * 100}%` }}
                                title={`${d.dayName}: ${d.aiRequests} AI isteği`}
                            />
                            {/* Label */}
                            <div className="text-xs text-gray-500 mt-1 text-center">
                                <div>{d.dayName.substring(0, 3)}</div>
                                <div className="text-[10px]">{new Date(d.date).getDate()}</div>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 justify-center mt-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-600 rounded"></div>
                        <span className="text-xs text-gray-600">Agent Sohbetleri</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-600 rounded"></div>
                        <span className="text-xs text-gray-600">AI İstekleri</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const RecentActivity = ({ className, data }: { className?: string | undefined; data: DashboardData }) => (
    <Card className={className}>
        <CardHeader>
            <CardTitle>Son Aktiviteler</CardTitle>
            <CardDescription>Son 30 gün özeti</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="space-y-6">
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Toplam Sohbetler</span>
                        <span className="text-sm font-medium">{data.last30Days.totalChats}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Pozitif Duygu Oranı</span>
                        <span className="text-sm font-medium">{data.last30Days.positiveSentimentPercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Agent Sohbetleri (30 gün)</span>
                        <span className="text-sm font-medium">{data.last30Days.agentChats}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">AI İstekleri (30 gün)</span>
                        <span className="text-sm font-medium">{data.last30Days.aiRequests}</span>
                    </div>
                </div>
            </div>
        </CardContent>
    </Card>
);


const PerformanceMetrics = ({ className, data }: { className?: string | undefined; data: DashboardData }) => {
    const last7DaysAvg = data.last7Days.agentChats / 7;
    const last30DaysAvg = data.last30Days.agentChats / 30;
    const todayTarget = last7DaysAvg;
    const todayProgress = data.today.agentChats > 0 ? Math.min((data.today.agentChats / todayTarget) * 100, 100) : 0;
    
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle>Performans Metrikleri</CardTitle>
                <CardDescription>Günlük ve aylık performans göstergeleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Bugünkü Sohbet Hedefi</span>
                        <span className="font-medium">{data.today.agentChats} / {Math.round(todayTarget)}</span>
                    </div>
                    <Progress value={todayProgress} />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Müşteri Memnuniyeti (Pozitif Duygu)</span>
                        <span className="font-medium">{data.last30Days.positiveSentimentPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={data.last30Days.positiveSentimentPercentage} />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Son 7 Gün Ortalama</span>
                        <span className="font-medium">{Math.round(last7DaysAvg)} sohbet/gün</span>
                    </div>
                    <Progress value={75} />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Son 30 Gün Ortalama</span>
                        <span className="font-medium">{Math.round(last30DaysAvg)} sohbet/gün</span>
                    </div>
                    <Progress value={80} />
                </div>
            </CardContent>
        </Card>
    );
};

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const data = await reportApiClient.getDashboardData();
                setDashboardData(data);
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
        const interval = setInterval(loadData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    if (loading || !dashboardData) {
        return (
            <ScrollArea className="h-full">
                <main className="p-4 md:p-8">
                    <div className="text-center py-8">Yükleniyor...</div>
                </main>
            </ScrollArea>
        );
    }

    const statData = [
        {
            title: "Aktif Agentler",
            value: dashboardData.activeAgentCount.toString(),
            change: "",
            description: "Şu anda aktif",
            icon: UsersIcon
        },
        {
            title: "Aktif Müşteriler",
            value: dashboardData.activeCustomerCount.toString(),
            change: "",
            description: "Şu anda aktif",
            icon: ActivityIcon
        },
        {
            title: "Toplam Agentler",
            value: dashboardData.totalAgents.toString(),
            change: "",
            description: "Sistemdeki toplam agent",
            icon: UsersIcon
        },
        {
            title: "Müsait Agentler",
            value: dashboardData.availableAgents.toString(),
            change: "",
            description: "Şu anda müsait",
            icon: UsersIcon
        },
        {
            title: "Bugünkü Sohbetler",
            value: dashboardData.today.agentChats.toString(),
            change: "",
            description: "Bugün toplam sohbet",
            icon: MessageSquareIcon
        },
        {
            title: "Bugünkü AI İstekleri",
            value: dashboardData.today.aiRequests.toString(),
            change: "",
            description: "Bugün toplam AI isteği",
            icon: BotIcon
        },
        {
            title: "Bugünkü Mesajlar",
            value: dashboardData.today.messages.toString(),
            change: "",
            description: "Bugün toplam mesaj",
            icon: MessageSquareIcon
        },
        {
            title: "Bugünkü Yeni Sohbetler",
            value: dashboardData.today.chatsCreated.toString(),
            change: "",
            description: "Bugün oluşturulan sohbet",
            icon: MessageSquareIcon
        },
        {
            title: "Son 7 Gün Sohbetler",
            value: dashboardData.last7Days.agentChats.toString(),
            change: "",
            description: "Haftalık toplam",
            icon: BarChart3Icon
        },
        {
            title: "Son 7 Gün AI İstekleri",
            value: dashboardData.last7Days.aiRequests.toString(),
            change: "",
            description: "Haftalık toplam",
            icon: BotIcon
        },
        {
            title: "Son 7 Gün Mesajlar",
            value: dashboardData.last7Days.messages.toString(),
            change: "",
            description: "Haftalık toplam",
            icon: MessageSquareIcon
        },
        {
            title: "Ortalama Günlük Sohbet (7 Gün)",
            value: dashboardData.last7Days.averageDailyChats.toFixed(1),
            change: "",
            description: "Günlük ortalama",
            icon: BarChart3Icon
        },
        {
            title: "Son 30 Gün Sohbetler",
            value: dashboardData.last30Days.agentChats.toString(),
            change: "",
            description: "Aylık toplam",
            icon: BarChart3Icon
        },
        {
            title: "Son 30 Gün AI İstekleri",
            value: dashboardData.last30Days.aiRequests.toString(),
            change: "",
            description: "Aylık toplam",
            icon: BotIcon
        },
        {
            title: "Son 30 Gün Mesajlar",
            value: dashboardData.last30Days.messages.toString(),
            change: "",
            description: "Aylık toplam",
            icon: MessageSquareIcon
        },
        {
            title: "Toplam Sohbetler (30 Gün)",
            value: dashboardData.last30Days.totalChats.toString(),
            change: "",
            description: "Tüm sohbetler",
            icon: BarChart3Icon
        },
        {
            title: "Pozitif Duygu Oranı",
            value: `${dashboardData.last30Days.positiveSentimentPercentage.toFixed(1)}%`,
            change: "",
            description: "Son 30 gün",
            icon: TrendingUpIcon
        },
        {
            title: "Negatif Duygu Oranı",
            value: `${dashboardData.last30Days.negativeSentimentPercentage.toFixed(1)}%`,
            change: "",
            description: "Son 30 gün",
            icon: TrendingDownIcon
        },
        {
            title: "Ortalama Günlük Sohbet (30 Gün)",
            value: dashboardData.last30Days.averageDailyChats.toFixed(1),
            change: "",
            description: "Günlük ortalama",
            icon: BarChart3Icon
        },
        {
            title: "Benzersiz Agentler (30 Gün)",
            value: dashboardData.uniqueAgentsLast30Days.toString(),
            change: "",
            description: "Farklı agent sayısı",
            icon: UsersIcon
        }
    ];

    return (
        <ScrollArea className="h-full">
            <main className="p-4 md:p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col items-start">
                        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                        <p className="text-gray-500 mt-1">Güncel istatistikler ve performans metrikleri</p>
                    </div>
                    <Button variant="outline">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">Son 30 Gün</span>
                        <span className="sm:hidden">30 Gün</span>
                    </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    {statData.map((stat, index) => (
                        <StatCard key={index} {...stat} />
                    ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-7">
                    <OverviewChart className="lg:col-span-4" chartData={dashboardData.dailyChartData} />
                    <RecentActivity className="lg:col-span-3" data={dashboardData} />
                </div>

                {/* Son 1 Saatlik Veriler */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Son 1 Saatlik Veriler</h2>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Son 1 Saat Agent Chat Başarısı */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Son 1 Saat Agent Chat Başarısı</CardTitle>
                                <CardDescription>Agent bazlı chat adedi</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {dashboardData.lastHour?.agentChatSuccess && dashboardData.lastHour.agentChatSuccess.length > 0 ? (
                                    <div className="space-y-2">
                                        {dashboardData.lastHour.agentChatSuccess.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                                                <span className="font-medium">{item.agentName}</span>
                                                <Badge variant="default">{item.chatCount} sohbet</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-gray-500">Veri bulunamadı</div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Son 1 Saat AI İstekleri */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Son 1 Saat AI İstekleri</CardTitle>
                                <CardDescription>Agent ve Chat bazlı AI istekleri</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {dashboardData.lastHour?.aiRequests && dashboardData.lastHour.aiRequests.length > 0 ? (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {dashboardData.lastHour.aiRequests.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{item.agentName}</span>
                                                    <span className="text-xs text-gray-500">Chat: {item.chatId.substring(0, 8)}...</span>
                                                </div>
                                                <Badge variant="secondary">{item.requestCount} istek</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-gray-500">Veri bulunamadı</div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Son 1 Saat Chat Duygu Analizi */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Son 1 Saat Chat Duygu Analizi</CardTitle>
                                <CardDescription>Müşteri ve agent duygu tonları</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {dashboardData.lastHour?.chatSentiments && dashboardData.lastHour.chatSentiments.length > 0 ? (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {dashboardData.lastHour.chatSentiments.map((item, index) => (
                                            <div key={index} className="p-2 border rounded space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-medium">{item.agentName}</span>
                                                    <span className="text-xs text-gray-500">Chat #{item.chatId}</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <Badge variant={
                                                        item.customerOverallTone.toLowerCase().includes("positive") || item.customerOverallTone.toLowerCase().includes("pozitif")
                                                            ? "default"
                                                            : item.customerOverallTone.toLowerCase().includes("negative") || item.customerOverallTone.toLowerCase().includes("negatif")
                                                                ? "destructive"
                                                                : "secondary"
                                                    }>
                                                        Müşteri: {item.customerOverallTone}
                                                    </Badge>
                                                    <Badge variant={
                                                        item.agentOverallTone.toLowerCase().includes("positive") || item.agentOverallTone.toLowerCase().includes("pozitif")
                                                            ? "default"
                                                            : item.agentOverallTone.toLowerCase().includes("negative") || item.agentOverallTone.toLowerCase().includes("negatif")
                                                                ? "destructive"
                                                                : "secondary"
                                                    }>
                                                        Agent: {item.agentOverallTone}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-gray-500">Veri bulunamadı</div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Son 1 Saat Kelime Kullanımı */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Son 1 Saat En Çok Kullanılan Kelimeler</CardTitle>
                                <CardDescription>Anahtar kelime kullanım istatistikleri</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {dashboardData.lastHour?.wordFrequencies && dashboardData.lastHour.wordFrequencies.length > 0 ? (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {dashboardData.lastHour.wordFrequencies.map((item, index) => (
                                            <div key={index} className="flex items-center justify-between p-2 border rounded">
                                                <span className="font-medium">{item.keyword}</span>
                                                <Badge variant="outline">{item.usageCount} kullanım</Badge>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4 text-gray-500">Veri bulunamadı</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {dashboardData.topAgents && dashboardData.topAgents.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>En İyi Performans Gösteren Agentler</CardTitle>
                            <CardDescription>Son 7 günde en çok sohbet yapan agentler</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                {dashboardData.topAgents.map((agent, index) => (
                                    <Card key={index}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <Badge variant="default">#{index + 1}</Badge>
                                                <AwardIcon className="h-4 w-4 text-yellow-500" />
                                            </div>
                                            <CardTitle className="text-sm mt-2">{agent.agentName}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{agent.totalChats}</div>
                                            <p className="text-xs text-gray-500 mt-1">Toplam sohbet</p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {dashboardData.topKeywords && dashboardData.topKeywords.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>En Çok Kullanılan Anahtar Kelimeler</CardTitle>
                            <CardDescription>Son 30 günde en sık kullanılan kelimeler</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {dashboardData.topKeywords.map((keyword, index) => (
                                    <Badge key={index} variant="secondary" className="text-sm p-2">
                                        {keyword.keyword} ({keyword.totalUsage})
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {dashboardData.hourlyActivity && dashboardData.hourlyActivity.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Günlük Saatlik Aktivite</CardTitle>
                            <CardDescription>Bugünün saatlik aktivite dağılımı</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[300px] flex items-end space-x-1">
                                {dashboardData.hourlyActivity.map((hour, index) => {
                                    const maxActivity = Math.max(...dashboardData.hourlyActivity.map(h => h.chats + h.messages));
                                    const height = maxActivity > 0 ? ((hour.chats + hour.messages) / maxActivity) * 100 : 0;
                                    return (
                                        <div key={index} className="flex-1 flex flex-col items-center">
                                            <div
                                                className="w-full bg-blue-600/70 hover:bg-blue-600 rounded-t-sm transition-all"
                                                style={{ height: `${height}%` }}
                                                title={`${hour.hourLabel}: ${hour.chats} sohbet, ${hour.messages} mesaj`}
                                            />
                                            <div className="text-xs text-gray-500 mt-1 text-center">
                                                <div>{hour.hour}</div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Haftalık Karşılaştırma</CardTitle>
                            <CardDescription>Bu hafta vs geçen hafta</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Bu Hafta</span>
                                    <span className="text-lg font-bold">{dashboardData.thisWeekChats}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600">Geçen Hafta</span>
                                    <span className="text-lg font-bold">{dashboardData.lastWeekChats}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t">
                                    <span className="text-sm font-medium">Değişim</span>
                                    <span className={`text-lg font-bold ${dashboardData.weekOverWeekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {dashboardData.weekOverWeekChange >= 0 ? '+' : ''}{dashboardData.weekOverWeekChange.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <PerformanceMetrics className="lg:col-span-1" data={dashboardData} />
                </div>
            </main>
        </ScrollArea>
    );
};

export default Dashboard;