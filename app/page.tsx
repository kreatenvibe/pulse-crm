"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Activity,
  User,
  ArrowRight,
  MoreHorizontal,
  BarChart3,
  Repeat,
  Calendar,
  Receipt,
  CheckCircle2,
  FileText,
} from "lucide-react";

export default function LandingPage() {
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll(".fade-in-up").forEach((el) => {
      observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="bg-background text-on-background text-sm antialiased min-h-screen flex flex-col font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        .fade-in-up {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1), transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .fade-in-up.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}} />

      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-surface transition-colors duration-200 ease-in-out hidden md:flex shadow-soft">
        <div className="flex justify-between items-center h-16 px-4 w-full max-w-[1440px] mx-auto">
          <div className="flex items-center gap-2">
            <Activity className="size-6 text-primary" />
            <span className="text-2xl font-bold text-primary">Pulse CRM</span>
          </div>
          <nav className="flex gap-6">
            <a className="text-on-surface-variant hover:bg-surface-container-high px-2 py-1 rounded text-lg font-semibold transition-transform hover:scale-105 active:scale-95" href="#">Features</a>
            <a className="text-on-surface-variant hover:bg-surface-container-high px-2 py-1 rounded text-lg font-semibold transition-transform hover:scale-105 active:scale-95" href="#">Pricing</a>
            <a className="text-on-surface-variant hover:bg-surface-container-high px-2 py-1 rounded text-lg font-semibold transition-transform hover:scale-105 active:scale-95" href="#">Resources</a>
          </nav>
          <div>
            <div className="text-on-surface-variant hover:bg-surface-container-high p-1 rounded cursor-pointer transition-transform hover:scale-110 active:scale-95">
              <User className="size-6" />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-grow pt-0 md:pt-16 pb-24 md:pb-0">
        {/* Hero Section */}
        <section className="relative pt-10 pb-10 px-4 md:px-6 max-w-[1440px] mx-auto flex flex-col items-center text-center fade-in-up">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-on-background tracking-tight">Precision at Every Pulse of Your Customer Journey.</h1>
            <p className="text-lg text-on-surface-variant mb-10">The authoritative workspace for end-to-end CRM—from lead capture to final invoice.</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Link href="/dashboard" className="bg-primary-container text-on-primary px-6 py-2 rounded eyebrow hover:bg-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-soft active:scale-95 flex items-center justify-center gap-1">
                Start Free Trial
                <ArrowRight className="size-4" />
              </Link>
              <Link href="/dashboard" className="bg-surface-container-lowest shadow-soft text-on-surface px-6 py-2 rounded eyebrow hover:bg-surface-container-low transition-all duration-300 hover:-translate-y-1 active:scale-95 flex items-center justify-center">
                Request Demo
              </Link>
            </div>
          </div>
          
          {/* Hero Image/Dashboard Preview Abstract */}
          <div className="mt-10 w-full max-w-4xl relative rounded-xl bg-surface-container-lowest overflow-hidden shadow-soft fade-in-up" style={{ transitionDelay: '100ms' }}>
            <div className="h-8 bg-surface-container-low flex items-center px-2 gap-1">
              <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
              <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
              <div className="w-3 h-3 rounded-full bg-surface-variant"></div>
            </div>
            <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-2 shadow-sm rounded p-4 bg-surface-bright transition-transform hover:scale-[1.02] duration-300">
                <div className="flex justify-between items-center mb-4 pb-2">
                  <span className="text-lg font-semibold text-on-surface">Revenue Pipeline</span>
                  <MoreHorizontal className="size-5 text-on-surface-variant" />
                </div>
                <div className="h-48 w-full bg-surface-container flex items-end justify-around p-2 rounded">
                  <div className="w-12 bg-secondary-container h-[40%] rounded-t relative transition-transform hover:scale-y-105 origin-bottom"><span className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-[13px] font-medium text-on-surface-variant">1.2k</span></div>
                  <div className="w-12 bg-tertiary-container h-[60%] rounded-t relative transition-transform hover:scale-y-105 origin-bottom"><span className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-[13px] font-medium text-on-surface-variant">800</span></div>
                  <div className="w-12 bg-primary-container h-[85%] rounded-t relative transition-transform hover:scale-y-105 origin-bottom"><span className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-[13px] font-medium text-on-surface-variant">640</span></div>
                  <div className="w-12 bg-on-secondary-fixed-variant h-[30%] rounded-t relative transition-transform hover:scale-y-105 origin-bottom"><span className="absolute -top-6 left-1/2 -translate-x-1/2 font-mono text-[13px] font-medium text-on-surface-variant">210</span></div>
                </div>
              </div>
              <div className="shadow-sm rounded p-4 bg-surface-bright flex flex-col gap-2 transition-transform hover:scale-[1.02] duration-300">
                <div className="text-lg font-semibold text-on-surface pb-2 mb-1">Recent Leads</div>
                <div className="flex items-center gap-2 p-2 rounded hover:bg-surface-container-low transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary font-semibold text-[10px]">JD</div>
                  <div>
                    <div className="text-sm font-semibold text-on-surface">John Doe</div>
                    <div className="text-xs text-on-surface-variant">Enterprise Corp</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-2 rounded hover:bg-surface-container-low transition-colors cursor-pointer">
                  <div className="w-8 h-8 rounded-full bg-tertiary-container flex items-center justify-center text-on-tertiary font-semibold text-[10px]">AS</div>
                  <div>
                    <div className="text-sm font-semibold text-on-surface">Alice Smith</div>
                    <div className="text-xs text-on-surface-variant">Tech Solutions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Bar */}
        <section className="bg-surface-container-lowest shadow-sm py-6 px-4 fade-in-up">
          <div className="max-w-[1440px] mx-auto text-center">
            <p className="eyebrow text-on-surface-variant mb-4">Trusted by Industry Leaders</p>
            <div className="flex flex-wrap justify-center items-center gap-6 md:gap-10 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
              <span className="text-2xl font-bold transition-transform hover:scale-110">Acentia</span>
              <span className="text-2xl font-bold transition-transform hover:scale-110">NexusCorp</span>
              <span className="text-2xl font-bold transition-transform hover:scale-110">Vanguard Systems</span>
              <span className="text-2xl font-bold transition-transform hover:scale-110">OmniTech</span>
            </div>
          </div>
        </section>

        {/* Capability Grid */}
        <section className="py-10 px-4 md:px-6 bg-background max-w-[1440px] mx-auto fade-in-up">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-2 text-on-background tracking-tight">Surgical Precision Across the Board</h2>
            <p className="text-lg text-on-surface-variant max-w-2xl mx-auto">Manage every touchpoint with rigorous analytical clarity.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-container-lowest shadow-sm rounded-lg p-6 hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded bg-primary-container/10 flex items-center justify-center mb-4 transition-transform hover:rotate-12 duration-300">
                <BarChart3 className="size-6 text-primary-container" />
              </div>
              <h3 className="text-2xl font-bold mb-1">Lead Tracking</h3>
              <p className="text-sm text-on-surface-variant">Capture and categorize prospects with automated scoring. Prioritize high-value targets instantly.</p>
            </div>
            <div className="bg-surface-container-lowest shadow-sm rounded-lg p-6 hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded bg-tertiary-container/10 flex items-center justify-center mb-4 transition-transform hover:rotate-12 duration-300">
                <Repeat className="size-6 text-tertiary-container" />
              </div>
              <h3 className="text-2xl font-bold mb-1">Lifecycle Management</h3>
              <p className="text-sm text-on-surface-variant">Map the entire customer journey. Maintain context across all interactions, from first contact to renewal.</p>
            </div>
            <div className="bg-surface-container-lowest shadow-sm rounded-lg p-6 hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded bg-secondary-container/20 flex items-center justify-center mb-4 transition-transform hover:rotate-12 duration-300">
                <Calendar className="size-6 text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-1">Appointment Scheduling</h3>
              <p className="text-sm text-on-surface-variant">Frictionless calendar syncing. Reduce no-shows with automated reminders and streamlined booking flows.</p>
            </div>
            <div className="bg-surface-container-lowest shadow-sm rounded-lg p-6 hover:shadow-soft transition-all duration-300 hover:-translate-y-1">
              <div className="w-12 h-12 rounded bg-on-secondary-fixed-variant/10 flex items-center justify-center mb-4 transition-transform hover:rotate-12 duration-300">
                <Receipt className="size-6 text-on-secondary-fixed-variant" />
              </div>
              <h3 className="text-2xl font-bold mb-1">Automated Invoicing</h3>
              <p className="text-sm text-on-surface-variant">Convert closed deals into accurate invoices immediately. Accelerate cash flow with integrated payment tracking.</p>
            </div>
          </div>
        </section>

        {/* Product Preview / Data First */}
        <section className="py-10 px-4 md:px-6 bg-surface-container-lowest shadow-sm fade-in-up">
          <div className="max-w-[1440px] mx-auto">
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="w-full md:w-1/2">
                <h2 className="text-4xl md:text-5xl font-bold mb-4 text-on-background tracking-tight">Data-First Architecture</h2>
                <p className="text-lg text-on-surface-variant mb-6">Access mission-critical metrics without cognitive overload. Our interface is designed to surface actionable insights instantly.</p>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center gap-2 transition-transform hover:translate-x-2 duration-300">
                    <CheckCircle2 className="size-4 text-primary" />
                    <span className="text-sm text-on-surface">Real-time pipeline analytics</span>
                  </li>
                  <li className="flex items-center gap-2 transition-transform hover:translate-x-2 duration-300">
                    <CheckCircle2 className="size-4 text-primary" />
                    <span className="text-sm text-on-surface">Customizable SLA alerting</span>
                  </li>
                  <li className="flex items-center gap-2 transition-transform hover:translate-x-2 duration-300">
                    <CheckCircle2 className="size-4 text-primary" />
                    <span className="text-sm text-on-surface">Cross-functional team visibility</span>
                  </li>
                </ul>
              </div>
              <div className="w-full md:w-1/2">
                <div className="shadow-soft rounded bg-surface-bright overflow-hidden transition-transform hover:scale-[1.02] duration-300">
                  <div className="bg-surface-container-low px-4 py-2 flex justify-between items-center">
                    <span className="eyebrow text-on-surface-variant">Performance Metrics</span>
                    <span className="font-mono text-[13px] font-medium text-on-surface-variant">Q3 2024</span>
                  </div>
                  <div className="p-0">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-surface-container-low/50">
                          <th className="py-1 px-4 eyebrow text-on-surface-variant">Metric</th>
                          <th className="py-1 px-4 eyebrow text-on-surface-variant text-right">Value</th>
                          <th className="py-1 px-4 eyebrow text-on-surface-variant text-right">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-surface-container-lowest transition-colors border-b border-surface-container-low/50">
                          <td className="py-2 px-4 text-xs text-on-surface">New Leads</td>
                          <td className="py-2 px-4 font-mono text-[13px] font-medium text-right text-on-surface">1,402</td>
                          <td className="py-2 px-4 font-mono text-[13px] font-medium text-right text-surface-tint">+12%</td>
                        </tr>
                        <tr className="hover:bg-surface-container-lowest transition-colors border-b border-surface-container-low/50">
                          <td className="py-2 px-4 text-xs text-on-surface">Conversion Rate</td>
                          <td className="py-2 px-4 font-mono text-[13px] font-medium text-right text-on-surface">24.5%</td>
                          <td className="py-2 px-4 font-mono text-[13px] font-medium text-right text-surface-tint">+2.1%</td>
                        </tr>
                        <tr className="hover:bg-surface-container-lowest transition-colors">
                          <td className="py-2 px-4 text-xs text-on-surface">Avg Close Time</td>
                          <td className="py-2 px-4 font-mono text-[13px] font-medium text-right text-on-surface">14 Days</td>
                          <td className="py-2 px-4 font-mono text-[13px] font-medium text-right text-secondary">-3 Days</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-10 px-4 text-center max-w-[1440px] mx-auto fade-in-up">
          <h2 className="text-4xl md:text-5xl font-bold mb-2 text-on-background tracking-tight">Take Command of Your Operations</h2>
          <p className="text-lg text-on-surface-variant mb-6">Deploy Pulse CRM today and experience operational clarity.</p>
          <Link href="/dashboard" className="inline-block bg-primary-container text-on-primary px-10 py-4 rounded eyebrow hover:bg-primary transition-all duration-300 hover:-translate-y-1 hover:shadow-soft active:scale-95">
            Start Free Trial
          </Link>
        </section>
      </main>

      {/* BottomNavBar */}
      <nav className="fixed bottom-0 w-full z-50 bg-surface shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] flex justify-around items-center h-20 px-2 pb-safe md:hidden">
        <Link href="/dashboard" className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-full px-4 py-1 active:scale-95 transition-transform duration-100">
          <BarChart3 className="size-5" />
          <span className="eyebrow mt-1">Leads</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-secondary hover:bg-surface-container-low rounded-full px-4 py-1 active:scale-95 transition-transform duration-100">
          <Calendar className="size-5" />
          <span className="eyebrow mt-1">Schedule</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-secondary hover:bg-surface-container-low rounded-full px-4 py-1 active:scale-95 transition-transform duration-100">
          <FileText className="size-5" />
          <span className="eyebrow mt-1">Service</span>
        </Link>
        <Link href="/dashboard" className="flex flex-col items-center justify-center text-secondary hover:bg-surface-container-low rounded-full px-4 py-1 active:scale-95 transition-transform duration-100">
          <Receipt className="size-5" />
          <span className="eyebrow mt-1">Billing</span>
        </Link>
      </nav>

      {/* Footer */}
      <footer className="w-full shadow-[0_-1px_3px_0_rgba(0,0,0,0.1)] bg-surface-container-lowest flex flex-col items-center gap-4 py-10 px-4 mb-20 md:mb-0">
        <div className="text-lg font-bold text-primary mb-2">Pulse CRM</div>
        <div className="flex gap-6 flex-wrap justify-center mb-2">
          <a className="text-xs text-on-surface-variant hover:text-primary underline-offset-4 hover:underline transition-colors" href="#">Privacy Policy</a>
          <a className="text-xs text-on-surface-variant hover:text-primary underline-offset-4 hover:underline transition-colors" href="#">Terms of Service</a>
          <a className="text-xs text-on-surface-variant hover:text-primary underline-offset-4 hover:underline transition-colors" href="#">Support</a>
        </div>
        <div className="text-xs text-on-surface-variant">© 2024 Pulse CRM. Operational Precision.</div>
      </footer>
    </div>
  );
}
