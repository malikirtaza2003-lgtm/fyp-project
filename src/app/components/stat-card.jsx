import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function StatCard({ title, value, icon: Icon, description, trend }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <p className={`text-xs ${trend.positive ? 'text-[#01B01B]' : 'text-destructive'}`}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
