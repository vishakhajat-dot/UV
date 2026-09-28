import { getSettings } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export const revalidate = 0;

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-brand-navy">Business Settings</h1>
      <p className="text-sm text-slate-500">These details print on every GST bill.</p>
      <div className="mt-6">
        <SettingsForm initial={settings} />
      </div>
    </div>
  );
}
