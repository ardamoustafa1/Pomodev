import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircleIcon, CheckCircle2Icon, CodeIcon, VariableIcon, FunctionSquareIcon, Edit3Icon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Editor from "react-simple-code-editor";
import { highlight, languages } from "prismjs";
import "prismjs/components/prism-javascript";
import "prismjs/themes/prism.css";

interface ScriptEditorProps
{
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    rows?: number;
    variables?: Array<{ name: string; value: string }>;
    functions?: Array<{ name: string; code: string }>;
    testMode?: boolean;
    onTest?: () => void;
    triggerButton?: boolean;
}

interface ScriptEditorModalProps
{
    value: string;
    onChange: (value: string) => void;
    label?: string;
    placeholder?: string;
    variables?: Array<{ name: string; value: string }>;
    functions?: Array<{ name: string; code: string }>;
    triggerLabel?: string;
    disabled?: boolean;
    testMode?: boolean;
    onRunTest?: (script: string, testInput: string) => { success: boolean; result: string };
}

export function ScriptEditor({
    value,
    onChange,
    label = "Script",
    placeholder = "return 'değer';",
    rows = 6,
    variables = [],
    functions = [],
    testMode = false,
    onTest
}: ScriptEditorProps)
{
    const [syntaxError, setSyntaxError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(false);
    const [showVariables, setShowVariables] = useState(false);
    const [showFunctions, setShowFunctions] = useState(false);

    // Syntax kontrolü
    useEffect(() =>
    {
        if (!value || value.trim() === "")
        {
            setSyntaxError(null);
            setIsValid(false);
            return;
        }

        try
        {
            // Script'i test et (çalıştırmadan sadece parse et)
            new Function('input', 'vars', value);
            setSyntaxError(null);
            setIsValid(true);
        } catch (err: any)
        {
            setSyntaxError(err.message);
            setIsValid(false);
        }
    }, [value]);

    // Değişken ekle
    const insertVariable = (varName: string) =>
    {
        const newValue = value + `vars.${varName}`;
        onChange(newValue);
        setShowVariables(false);
    };

    // Fonksiyon ekle
    const insertFunction = (funcName: string) =>
    {
        const newValue = value + `${funcName}()`;
        onChange(newValue);
        setShowFunctions(false);
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{label}</Label>
                <div className="flex items-center gap-2">
                    {/* Değişkenler Popover */}
                    <Popover open={showVariables} onOpenChange={setShowVariables}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                                <VariableIcon className="h-3 w-3 mr-1" />
                                Değişkenler ({variables.length})
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72" align="end">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <VariableIcon className="h-4 w-4" />
                                    Mevcut Değişkenler
                                </h4>
                                {variables.length === 0 ? (
                                    <p className="text-xs text-gray-500">Henüz değişken tanımlanmamış</p>
                                ) : (
                                    <ScrollArea className="h-48">
                                        <div className="space-y-1">
                                            {variables.map((v) => (
                                                <div
                                                    key={v.name}
                                                    onClick={() => insertVariable(v.name)}
                                                    className="p-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-200"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <code className="text-xs font-mono font-semibold text-blue-600">
                                                            vars.{v.name}
                                                        </code>
                                                        <Badge variant="outline" className="text-xs">
                                                            Ekle
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1 font-mono truncate">
                                                        {v.value}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Fonksiyonlar Popover */}
                    <Popover open={showFunctions} onOpenChange={setShowFunctions}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                                <FunctionSquareIcon className="h-3 w-3 mr-1" />
                                Fonksiyonlar ({functions.length})
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80" align="end">
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <FunctionSquareIcon className="h-4 w-4" />
                                    Mevcut Fonksiyonlar
                                </h4>
                                {functions.length === 0 ? (
                                    <p className="text-xs text-gray-500">Henüz fonksiyon tanımlanmamış</p>
                                ) : (
                                    <ScrollArea className="h-48">
                                        <div className="space-y-1">
                                            {functions.map((f) => (
                                                <div
                                                    key={f.name}
                                                    onClick={() => insertFunction(f.name)}
                                                    className="p-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-200"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <code className="text-xs font-mono font-semibold text-purple-600">
                                                            {f.name}()
                                                        </code>
                                                        <Badge variant="outline" className="text-xs">
                                                            Ekle
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-gray-600 mt-1 font-mono truncate">
                                                        {f.code.substring(0, 60)}...
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </ScrollArea>
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>

                    {/* Syntax durumu */}
                    {value && (
                        <div className="flex items-center">
                            {isValid ? (
                                <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                            ) : (
                                <AlertCircleIcon className="h-4 w-4 text-red-600" />
                            )}
                        </div>
                    )}

                    {/* Test butonu */}
                    {testMode && onTest && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={onTest}>
                            <CodeIcon className="h-3 w-3 mr-1" />
                            Test Et
                        </Button>
                    )}
                </div>
            </div>

            {/* Script Textarea */}
            <Textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="font-mono text-sm resize-y"
                rows={rows}
                placeholder={placeholder}
            />

            {/* Syntax Hatası */}
            {syntaxError && (
                <Alert variant="destructive" className="py-2">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                        <strong>Syntax Hatası:</strong> {syntaxError}
                    </AlertDescription>
                </Alert>
            )}

            {/* Yardım metni */}
            {!syntaxError && (
                <p className="text-xs text-gray-500">
                    Script bir <code className="bg-gray-100 px-1 rounded">return</code> ifadesi içermelidir.
                    <code className="bg-gray-100 px-1 rounded ml-1">vars</code> objesi ile değişkenlere erişebilirsiniz.
                </p>
            )}
        </div>
    );
}

// Modal versiyonu - Sidebar'da kullanım için
export function ScriptEditorModal({
    value,
    onChange,
    label = "Script",
    placeholder = "return 'değer';",
    variables = [],
    functions = [],
    triggerLabel = "Script Düzenle",
    disabled = false,
    testMode = false,
    onRunTest
}: ScriptEditorModalProps)
{
    const [open, setOpen] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const [syntaxError, setSyntaxError] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(false);
    const [testInput, setTestInput] = useState('{}');
    const [testResult, setTestResult] = useState<string | null>(null);

    // Modal açıldığında temp değeri güncelle
    useEffect(() =>
    {
        if (open)
        {
            setTempValue(value);
        }
    }, [open, value]);

    // Syntax kontrolü
    useEffect(() =>
    {
        if (!tempValue || tempValue.trim() === "")
        {
            setSyntaxError(null);
            setIsValid(false);
            return;
        }

        try
        {
            new Function('input', 'vars', tempValue);
            setSyntaxError(null);
            setIsValid(true);
        } catch (err: any)
        {
            setSyntaxError(err.message);
            setIsValid(false);
        }
    }, [tempValue]);

    const handleSave = () =>
    {
        onChange(tempValue);
        setOpen(false);
    };

    const handleCancel = () =>
    {
        setTempValue(value);
        setOpen(false);
    };

    // Değişken ekle
    const insertVariable = (varName: string) =>
    {
        setTempValue(prev => prev + `vars.${varName}`);
    };

    // Fonksiyon ekle
    const insertFunction = (funcName: string) =>
    {
        setTempValue(prev => prev + `${funcName}()`);
    };

    // Test çalıştır
    const handleRunTest = () =>
    {
        if (onRunTest)
        {
            const result = onRunTest(tempValue, testInput);
            setTestResult(result.result);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full" disabled={disabled}>
                    <Edit3Icon className="h-3 w-3 mr-2" />
                    {triggerLabel}
                    {value && (
                        <Badge variant={isValid ? "default" : "destructive"} className="ml-2 h-4 px-1">
                            {isValid
                                ? <CheckCircle2Icon className="h-3 w-3" />
                                : <AlertCircleIcon className="h-3 w-3" />}
                        </Badge>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="w-[90vw] min-w-[1000px] h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle>{label}</DialogTitle>
                    <DialogDescription>
                        JavaScript kodu yazın. Script bir return ifadesi içermelidir.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 flex gap-4 overflow-hidden">
                    {/* Sol taraf - Script Editör */}
                    <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
                        {/* Toolbar */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Syntax durumu */}
                            {tempValue && (
                                <div className="flex items-center gap-1">
                                    {isValid ? (
                                        <>
                                            <CheckCircle2Icon className="h-4 w-4 text-green-600" />
                                            <span className="text-xs text-green-600">Geçerli</span>
                                        </>
                                    ) : (
                                        <>
                                            <AlertCircleIcon className="h-4 w-4 text-red-600" />
                                            <span className="text-xs text-red-600">Hatalı</span>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Script Editor with Syntax Highlighting */}
                        <div className="flex-1 border rounded-md overflow-hidden bg-white">
                            <Editor
                                value={tempValue}
                                onValueChange={setTempValue}
                                highlight={code => highlight(code, languages.javascript, 'javascript')}
                                padding={16}
                                placeholder={placeholder}
                                style={{
                                    fontFamily: '"Fira code", "Fira Mono", "Consolas", "Monaco", monospace',
                                    fontSize: 14,
                                    backgroundColor: '#ffffff',
                                    minHeight: '100%',
                                    outline: 'none'
                                }}
                                textareaClassName="focus:outline-none"
                            />
                        </div>

                        {/* Syntax Hatası */}
                        {syntaxError && (
                            <Alert variant="destructive" className="flex-shrink-0">
                                <AlertCircleIcon className="h-4 w-4" />
                                <AlertDescription className="text-xs">
                                    <strong>Syntax Hatası:</strong> {syntaxError}
                                </AlertDescription>
                            </Alert>
                        )}

                        {/* Yardım metni */}
                        {!syntaxError && (
                            <div className="text-xs text-gray-500 space-y-1 bg-gray-50 p-3 rounded border border-gray-200 flex-shrink-0">
                                <p>
                                    • Script bir <code className="bg-white px-1 rounded border">return</code> ifadesi içermelidir
                                </p>
                                <p>
                                    • <code className="bg-white px-1 rounded border">vars</code> objesi ile değişkenlere erişebilirsiniz
                                </p>
                                <p>
                                    • <code className="bg-white px-1 rounded border">input</code> objesi ile gelen veriye erişebilirsiniz
                                </p>
                            </div>
                        )}

                        {/* Test Alanı */}
                        {testMode && onRunTest && (
                            <div className="flex-shrink-0 space-y-2 p-3 bg-blue-50 rounded border border-blue-200">
                                <Label className="text-sm font-semibold">Script Testi</Label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={testInput}
                                        onChange={(e) => setTestInput(e.target.value)}
                                        placeholder={`Test verisi (JSON): ${variables.map(v => v.name).join(', ') || '{}'}`}
                                        className="text-sm font-mono"
                                    />
                                    <Button size="sm" onClick={handleRunTest} disabled={!isValid}>
                                        <CodeIcon className="h-3 w-3 mr-1" />
                                        Çalıştır
                                    </Button>
                                </div>
                                {testResult && (
                                    <div>
                                        <Label className="text-xs">Sonuç</Label>
                                        <div className="mt-1 p-2 bg-white rounded text-sm font-mono border border-blue-300">{testResult}</div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sağ taraf - Değişkenler ve Fonksiyonlar */}
                    <div className="w-1/4 min-w-[300px] flex flex-col border-l border-gray-200 pl-4 overflow-hidden">
                        <Tabs defaultValue="variables" className="flex-1 flex flex-col overflow-hidden">
                            <TabsList className="grid w-full grid-cols-2 flex-shrink-0">
                                <TabsTrigger value="variables" className="text-xs">
                                    <VariableIcon className="h-3 w-3 mr-1" />
                                    Değişkenler
                                </TabsTrigger>
                                <TabsTrigger value="functions" className="text-xs">
                                    <FunctionSquareIcon className="h-3 w-3 mr-1" />
                                    Fonksiyonlar
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="variables" className="flex-1 overflow-hidden mt-2">
                                <ScrollArea className="h-full pr-2">
                                    {variables.length === 0 ? (
                                        <p className="text-xs text-gray-500 text-center py-4">Henüz değişken tanımlanmamış</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {variables.map((v) => (
                                                <div
                                                    key={v.name}
                                                    onClick={() => insertVariable(v.name)}
                                                    className="p-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-200 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <code className="text-xs font-mono font-semibold text-blue-600">
                                                            vars.{v.name}
                                                        </code>
                                                        <Badge variant="secondary" className="text-xs h-5">
                                                            Ekle
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-gray-600 font-mono break-all bg-gray-50 p-1 rounded">
                                                        {v.value}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>

                            <TabsContent value="functions" className="flex-1 overflow-hidden mt-2">
                                <ScrollArea className="h-full pr-2">
                                    {functions.length === 0 ? (
                                        <p className="text-xs text-gray-500 text-center py-4">Henüz fonksiyon tanımlanmamış</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {functions.map((f) => (
                                                <div
                                                    key={f.name}
                                                    onClick={() => insertFunction(f.name)}
                                                    className="p-2 hover:bg-gray-100 rounded cursor-pointer border border-gray-200 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <code className="text-xs font-mono font-semibold text-purple-600">
                                                            {f.name}()
                                                        </code>
                                                        <Badge variant="secondary" className="text-xs h-5">
                                                            Ekle
                                                        </Badge>
                                                    </div>
                                                    <div className="text-xs text-gray-600 font-mono break-all bg-gray-50 p-1 rounded">
                                                        {f.code.substring(0, 80)}{f.code.length > 80 ? '...' : ''}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </ScrollArea>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        İptal
                    </Button>
                    <Button onClick={handleSave} disabled={!isValid && tempValue.trim() !== ""}>
                        Kaydet
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
