import { fetchRevenue, fetchLatestInvoices  } from '@/app/lib/data';
import RevenueChart from '@/app/ui/dashboard/revenue-chart';
import LatestInvoices from '@/app/ui/dashboard/latest-invoices';
const latestInvoices = await fetchLatestInvoices();

export async function Hook (){
    const revenue = await fetchRevenue();
    return (
      <RevenueChart revenue={revenue}></RevenueChart>
    )
}
export async function HookLatestInvoices (){
    const revenue = await fetchRevenue();
    return (
      <LatestInvoices  latestInvoices={latestInvoices}></LatestInvoices>
    )
}