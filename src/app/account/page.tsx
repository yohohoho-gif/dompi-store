import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AccountDashboard from "@/components/account/AccountDashboard";
import { requireCustomer } from "@/lib/auth";
import { getCustomerProfile, getCustomerAddresses } from "@/lib/profile";

export const metadata: Metadata = {
  title: "My Account | DOMPI Customer Archive",
  description: "Manage your DOMPI customer account, session, and personal profile.",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { customer } = await requireCustomer("/account");
  const [profile, addresses] = await Promise.all([
    getCustomerProfile(),
    getCustomerAddresses(),
  ]);

  return (
    <div className="min-h-screen bg-white text-black flex flex-col antialiased selection:bg-black selection:text-white">
      <Navbar />

      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
        <AccountDashboard
          customer={customer}
          profile={profile}
          addresses={addresses}
        />
      </main>

      <Footer />
    </div>
  );
}
