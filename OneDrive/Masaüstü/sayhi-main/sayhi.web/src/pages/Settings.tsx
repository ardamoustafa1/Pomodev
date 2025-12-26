import { useState } from "react"
import { UserIcon, BellIcon, ShieldIcon, PaletteIcon, CreditCardIcon } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

function TabProfile()
{
    const [name, setName] = useState("John Doe");
    const [email, setEmail] = useState("john.doe@example.com");
    const [bio, setBio] = useState("Yazılım Geliştirici");
    const [username, setUsername] = useState("johndoe");

    return (
        <Card>
            <CardHeader>
                <CardTitle>Profil Bilgileri</CardTitle>
                <CardDescription>
                    Genel profil bilgilerinizi güncelleyin
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                        <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" />
                        <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                        <Button variant="outline">Fotoğraf Değiştir</Button>
                        <p className="text-xs text-gray-500">JPG, PNG veya GIF. Maksimum 2MB.</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Ad Soyad</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="username">Kullanıcı Adı</Label>
                        <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="email">E-posta</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="bio">Biyografi</Label>
                        <Textarea
                            id="bio"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                        />
                        <p className="text-xs text-gray-500">
                            Kısaca kendinizden bahsedin. Maksimum 160 karakter.
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button>Değişiklikleri Kaydet</Button>
                </div>
            </CardContent>
        </Card>
    );
}

function TabNotifications()
{
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [pushNotifications, setPushNotifications] = useState(false);
    const [smsNotifications, setSmsNotifications] = useState(true);
    const [marketingEmails, setMarketingEmails] = useState(false);
    const [securityAlerts, setSecurityAlerts] = useState(true);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Bildirim Ayarları</CardTitle>
                <CardDescription>
                    Hangi bildirimleri almak istediğinizi seçin
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>E-posta Bildirimleri</Label>
                            <p className="text-sm text-gray-500">
                                Önemli güncellemeler için e-posta alın
                            </p>
                        </div>
                        <Switch
                            checked={emailNotifications}
                            onCheckedChange={setEmailNotifications}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Push Bildirimleri</Label>
                            <p className="text-sm text-gray-500">
                                Tarayıcı bildirimleri alın
                            </p>
                        </div>
                        <Switch
                            checked={pushNotifications}
                            onCheckedChange={setPushNotifications}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>SMS Bildirimleri</Label>
                            <p className="text-sm text-gray-500">
                                Acil durumlar için SMS alın
                            </p>
                        </div>
                        <Switch
                            checked={smsNotifications}
                            onCheckedChange={setSmsNotifications}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Pazarlama E-postaları</Label>
                            <p className="text-sm text-gray-500">
                                Yeni özellikler ve güncellemeler hakkında bilgi alın
                            </p>
                        </div>
                        <Switch
                            checked={marketingEmails}
                            onCheckedChange={setMarketingEmails}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>Güvenlik Uyarıları</Label>
                            <p className="text-sm text-gray-500">
                                Hesap güvenliği ile ilgili uyarılar
                            </p>
                        </div>
                        <Switch
                            checked={securityAlerts}
                            onCheckedChange={setSecurityAlerts}
                        />
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button>Kaydet</Button>
                </div>
            </CardContent>
        </Card>

    );
}

function TabAppearance()
{
    const [theme, setTheme] = useState("light");
    const [language, setLanguage] = useState("tr");
    const [fontSize, setFontSize] = useState("medium");

    return (
        <Card>
            <CardHeader>
                <CardTitle>Görünüm Ayarları</CardTitle>
                <CardDescription>
                    Uygulamanın görünümünü özelleştirin
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid gap-4">
                    <div className="grid gap-2">
                        <Label htmlFor="theme">Tema</Label>
                        <Select value={theme} onValueChange={setTheme}>
                            <SelectTrigger id="theme">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="light">Açık</SelectItem>
                                <SelectItem value="dark">Koyu</SelectItem>
                                <SelectItem value="system">Sistem</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                            Uygulamanın tema rengini seçin
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="language">Dil</Label>
                        <Select value={language} onValueChange={setLanguage}>
                            <SelectTrigger id="language">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="tr">Türkçe</SelectItem>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="de">Deutsch</SelectItem>
                                <SelectItem value="fr">Français</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="fontSize">Yazı Boyutu</Label>
                        <Select value={fontSize} onValueChange={setFontSize}>
                            <SelectTrigger id="fontSize">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="small">Küçük</SelectItem>
                                <SelectItem value="medium">Orta</SelectItem>
                                <SelectItem value="large">Büyük</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button>Kaydet</Button>
                </div>
            </CardContent>
        </Card>

    );
}

function TabSecurity()
{
    const [twoFactor, setTwoFactor] = useState(false);
    const [sessionTimeout, setSessionTimeout] = useState("30");

    return (
        <Card>
            <CardHeader>
                <CardTitle>Güvenlik Ayarları</CardTitle>
                <CardDescription>
                    Hesabınızın güvenliğini yönetin
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Şifre</h3>
                        <div className="grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="currentPassword">Mevcut Şifre</Label>
                                <Input id="currentPassword" type="password" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="newPassword">Yeni Şifre</Label>
                                <Input id="newPassword" type="password" />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
                                <Input id="confirmPassword" type="password" />
                            </div>
                            <Button className="w-fit">Şifreyi Güncelle</Button>
                        </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>İki Faktörlü Doğrulama</Label>
                            <p className="text-sm text-gray-500">
                                Hesabınızı ekstra bir güvenlik katmanı ile koruyun
                            </p>
                        </div>
                        <Switch
                            checked={twoFactor}
                            onCheckedChange={setTwoFactor}
                        />
                    </div>

                    <Separator />

                    <div className="grid gap-2">
                        <Label htmlFor="sessionTimeout">Oturum Zaman Aşımı</Label>
                        <Select value={sessionTimeout} onValueChange={setSessionTimeout}>
                            <SelectTrigger id="sessionTimeout">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="15">15 dakika</SelectItem>
                                <SelectItem value="30">30 dakika</SelectItem>
                                <SelectItem value="60">1 saat</SelectItem>
                                <SelectItem value="never">Hiçbir zaman</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-500">
                            İşlem yapılmadığında oturumunuz otomatik kapanır
                        </p>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button>Kaydet</Button>
                </div>
            </CardContent>
        </Card>
    );
}

function TabBilling()
{
    return (
        <Card>
            <CardHeader>
                <CardTitle>Faturalama Bilgileri</CardTitle>
                <CardDescription>
                    Ödeme yönteminizi ve faturalama bilgilerinizi yönetin
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="rounded-lg border p-4 bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-semibold">Pro Plan</h4>
                            <p className="text-sm text-gray-600">₺299/ay</p>
                        </div>
                        <Button variant="outline">Planı Değiştir</Button>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">Ödeme Yöntemi</h3>
                    <div className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <CreditCardIcon className="h-8 w-8 text-gray-400" />
                                <div>
                                    <p className="font-medium">•••• •••• •••• 4242</p>
                                    <p className="text-sm text-gray-500">Son kullanma: 12/25</p>
                                </div>
                            </div>
                            <Button variant="outline">Güncelle</Button>
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">Fatura Geçmişi</h3>
                    <div className="space-y-2">
                        {[
                            { date: "01 Oca 2024", amount: "₺299", status: "Ödendi" },
                            { date: "01 Ara 2023", amount: "₺299", status: "Ödendi" },
                            { date: "01 Kas 2023", amount: "₺299", status: "Ödendi" }
                        ].map((invoice, i) => (
                            <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                                <div>
                                    <p className="font-medium">{invoice.date}</p>
                                    <p className="text-sm text-gray-500">{invoice.status}</p>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <p className="font-semibold">{invoice.amount}</p>
                                    <Button variant="ghost" size="sm">İndir</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function Settings()
{
    const [activeTab, setActiveTab] = useState("profile");

    return (
        <ScrollArea className="h-full">
            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="text-left">
                    <h1 className="text-3xl font-bold text-gray-900">Ayarlar</h1>
                    <p className="text-gray-500 mt-1">Hesap ayarlarınızı ve tercihlerinizi yönetin</p>
                </div>

                <Separator />
                <div className="w-full max-w-md p-6">
                    <Tabs className="flex-row gap-4" value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="h-full flex-col gap-2">
                            <TabsTrigger value="profile" className="flex w-full flex-row items-center justify-start gap-1" aria-label="tab-trigger">
                                <UserIcon className="h-4 w-4 mr-2" />
                                Profil
                            </TabsTrigger>
                            <TabsTrigger value="notifications" className="flex w-full flex-row items-center justify-start gap-1" aria-label="tab-trigger">
                                <BellIcon className="h-4 w-4 mr-2" />
                                Bildirimler
                            </TabsTrigger>
                            <TabsTrigger value="appearance" className="flex w-full flex-row items-center justify-start gap-1" aria-label="tab-trigger">
                                <PaletteIcon className="h-4 w-4 mr-2" />
                                Görünüm
                            </TabsTrigger>
                            <TabsTrigger value="security" className="flex w-full flex-row items-center justify-start gap-1" aria-label="tab-trigger">
                                <ShieldIcon className="h-4 w-4 mr-2" />
                                Güvenlik
                            </TabsTrigger>
                            <TabsTrigger value="billing" className="flex w-full flex-row items-center justify-start gap-1" aria-label="tab-trigger">
                                <CreditCardIcon className="h-4 w-4 mr-2" />
                                Faturalama
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="profile" className="ml-6">
                            <div className="min-h-[100px] flex items-start">
                                <p className="text-muted-foreground text-sm">
                                    <TabProfile />
                                </p>
                            </div>
                        </TabsContent>
                        <TabsContent value="notifications" className="ml-6">
                            <div className="min-h-[100px] flex items-start">
                                <p className="text-muted-foreground text-sm">
                                    <TabNotifications />
                                </p>
                            </div>
                        </TabsContent>
                        <TabsContent value="appearance" className="ml-6">
                            <div className="min-h-[100px] flex items-start">
                                <p className="text-muted-foreground text-sm">
                                    <TabAppearance />
                                </p>
                            </div>
                        </TabsContent>
                        <TabsContent value="security" className="ml-6">
                            <div className="min-h-[100px] flex items-start">
                                <p className="text-muted-foreground text-sm">
                                    <TabSecurity />
                                </p>
                            </div>
                        </TabsContent>
                        <TabsContent value="billing" className="ml-6">
                            <div className="min-h-[100px] flex items-start">
                                <p className="text-muted-foreground text-sm">
                                    <TabBilling />
                                </p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                <Separator />

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="profile">
                            <UserIcon className="h-4 w-4 mr-2" />
                            Profil
                        </TabsTrigger>
                        <TabsTrigger value="notifications">
                            <BellIcon className="h-4 w-4 mr-2" />
                            Bildirimler
                        </TabsTrigger>
                        <TabsTrigger value="appearance">
                            <PaletteIcon className="h-4 w-4 mr-2" />
                            Görünüm
                        </TabsTrigger>
                        <TabsTrigger value="security">
                            <ShieldIcon className="h-4 w-4 mr-2" />
                            Güvenlik
                        </TabsTrigger>
                        <TabsTrigger value="billing">
                            <CreditCardIcon className="h-4 w-4 mr-2" />
                            Faturalama
                        </TabsTrigger>
                    </TabsList>

                    {/* Profile Tab */}
                    <TabsContent value="profile" className="space-y-6">
                        <TabProfile />
                    </TabsContent>

                    {/* Notifications Tab */}
                    <TabsContent value="notifications" className="space-y-6">
                        <TabNotifications />
                    </TabsContent>

                    {/* Appearance Tab */}
                    <TabsContent value="appearance" className="space-y-6">
                        <TabAppearance />
                    </TabsContent>

                    {/* Security Tab */}
                    <TabsContent value="security" className="space-y-6">
                        <TabSecurity />
                    </TabsContent>

                    {/* Billing Tab */}
                    <TabsContent value="billing" className="space-y-6">
                        <TabBilling />
                    </TabsContent>
                </Tabs>
            </div>
        </ScrollArea>

    );
}