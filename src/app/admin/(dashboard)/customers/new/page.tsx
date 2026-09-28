import { getSettings } from "@/lib/settings";
import CustomerForm from "@/components/admin/CustomerForm";

export const revalidate = 0;

export default async function NewCustomerPage() {
  const settings = await getSettings();
  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold text-brand-navy">Add Customer</h1>
      <div className="mt-6">
        <CustomerForm defaultState={settings.state} />
      </div>
    </div>
  );
}
