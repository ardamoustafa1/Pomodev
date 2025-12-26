import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"

export default function NodeCard({ data }: {
    //id: string;
    data: { label: string; };
})
{
    return (
        <Card className="p-2 shadow">
            <CardContent>
                <Input value={data.label} readOnly />
            </CardContent>
        </Card>
    );
}