import Link from "next/link";
import {
  ArrowRight,
  Bell,
  ClipboardCheck,
  LockKeyhole,
  MapPin,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";

const features = [
  { title: "Operations in one place", detail: "Tickets, emergency reporting, status updates, contacts, and admin reporting.", icon: ClipboardCheck },
  { title: "Resident communication", detail: "Announcements, community feed, events, notifications, and directory tools.", icon: Bell },
  { title: "Adapts by community type", detail: "Neighbourhoods, estates, gated communities, apartments, townhouses, and villages.", icon: PhoneCall },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F7F8FA] text-[#1B1B1B]">
      <header className="border-b border-zinc-200 bg-white/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#006B3C] text-white">
              <MapPin size={21} />
            </span>
            <span className="text-lg font-bold">NeighbourHub</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100">
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-[#006B3C] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#00522f]"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.08fr_0.92fr] lg:px-8 lg:py-20">
        <div className="flex flex-col justify-center">
          <span className="mb-5 inline-flex w-fit rounded-full bg-[#C8A23A]/15 px-3 py-1 text-sm font-semibold text-[#755908] ring-1 ring-[#C8A23A]/25">
            Community Management Platform
          </span>
          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
            The complete community management platform.
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
            NeighbourHub supports neighbourhoods, estates, complexes, HOAs, and community associations from one simple portal that adapts to each residential community type.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#006B3C] px-5 py-3 text-sm font-bold text-white shadow-md hover:-translate-y-0.5 hover:bg-[#00522f]"
            >
              Create resident account
              <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white px-5 py-3 text-sm font-bold text-zinc-800 shadow-sm hover:border-[#C8A23A]"
            >
              Use demo login
            </Link>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            Resident: resident@neighbourhub.local / resident123. Admin: admin@neighbourhub.local / admin123. Super Admin: super@neighbourhub.local / super123.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-200 bg-white p-5 shadow-xl shadow-zinc-200/70">
          <div className="rounded-lg bg-[#006B3C] p-5 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/75">One platform, many communities</p>
                <h2 className="mt-1 text-2xl font-bold">NeighbourHub adapts</h2>
              </div>
              <ShieldCheck size={34} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {["Neighbourhoods", "Estates", "Apartments", "Retirement villages"].map((item) => (
                <div key={item} className="rounded-lg bg-white/10 p-3 ring-1 ring-white/15">
                  <p className="text-sm font-semibold">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 space-y-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="flex gap-4 rounded-lg border border-zinc-100 bg-[#F7F8FA] p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#C8A23A]/20 text-[#006B3C]">
                    <Icon size={20} />
                  </span>
                  <div>
                    <h3 className="font-bold">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-zinc-600">{feature.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3 lg:px-8">
          {[
            ["How it works", "Residents report, discuss, RSVP, vote, and stay informed while admins manage operations from one place."],
            ["Live operations view", "Map markers, security centre, polls, businesses, groups, and gallery bring community activity into focus."],
            ["Demo-ready communities", "Switch between neighbourhoods, estates, gated communities, apartments, townhouses, and retirement villages."],
          ].map(([title, copy]) => (
            <div key={title} className="rounded-lg bg-[#F7F8FA] p-6">
              <p className="font-bold">{title}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-600">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:grid-cols-3 sm:px-6 lg:px-8">
          {["For neighbourhoods", "For estates and HOAs", "For complexes and villages"].map((item) => (
            <div key={item} className="rounded-lg bg-[#F7F8FA] p-5">
              <LockKeyhole className="text-[#C8A23A]" size={22} />
              <p className="mt-3 font-bold">{item}</p>
              <p className="mt-1 text-sm text-zinc-600">Simple, practical tools that stay lightweight while communities grow.</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
