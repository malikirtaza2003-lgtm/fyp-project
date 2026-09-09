import { useState } from "react";
import { AppLayout } from "../components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Bell, Eye } from "lucide-react";
import { showToast } from "../utils/toast";

export default function EmployeeSettings() {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    theme: "light",
    language: "en",
  });

  const handleSave = () => {
    showToast("Settings saved successfully", "success");
  };

  return (
    <AppLayout userRole="employee">
      <div className="space-y-6">
        <div>
          <h1>Settings</h1>
          <p className="text-muted-foreground">Manage your preferences and account settings</p>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Email Notifications", key: "emailNotifications" },
              { label: "SMS Notifications", key: "smsNotifications" },
              { label: "Push Notifications", key: "pushNotifications" },
            ].map(n => (
              <div key={n.key} className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">{n.label}</label>
                <input
                  type="checkbox"
                  checked={settings[n.key]}
                  onChange={e => setSettings({...settings, [n.key]: e.target.checked})}
                  className="w-4 h-4 rounded"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Theme</Label>
              <Select defaultValue={settings.theme} onValueChange={v => setSettings({...settings, theme: v})}>
                <SelectTrigger className="mt-1 rounded-lg border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-semibold">Language</Label>
              <Select defaultValue={settings.language} onValueChange={v => setSettings({...settings, language: v})}>
                <SelectTrigger className="mt-1 rounded-lg border-gray-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Password</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full rounded-lg border-gray-200">
              Change Password
            </Button>
          </CardContent>
        </Card>

        <Button onClick={handleSave} className="w-full bg-[#162E93] hover:bg-[#1a36a8] rounded-lg">
          Save Settings
        </Button>
      </div>
    </AppLayout>
  );
}
