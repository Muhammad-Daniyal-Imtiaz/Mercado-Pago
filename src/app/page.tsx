"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { 
  Shield, 
  Target, 
  Bell, 
  Building2, 
  Mail, 
  BarChart3,
  ArrowRight,
  LayoutDashboard,
  LogIn,
  UserPlus,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Users,
  Zap,
  Activity
} from "lucide-react";

export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/session');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Session fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black">

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <span className="text-white font-bold text-xl">AlertFlow</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-300 hover:text-white transition-colors">Features</Link>
            <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
            <Link href="#about" className="text-gray-300 hover:text-white transition-colors">About</Link>
            {user ? (
              <Link 
                href="/dashboard" 
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-medium hover:opacity-90 transition-all flex items-center gap-2"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            ) : (
              <div className="flex gap-3">
                <Link 
                  href="/login" 
                  className="px-5 py-2 text-white border border-white/20 rounded-full hover:bg-white/10 transition-all flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  Sign In
                </Link>
                <Link 
                  href="/signup" 
                  className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-medium hover:opacity-90 transition-all flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-32 pb-20">
          <div className="text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-8 border border-white/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-sm text-gray-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Platform Status: Operational
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Intelligent Alert
              <span className="block bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Management Platform
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10">
              Transform how your team handles alerts with real-time notifications, 
              smart routing, and actionable insights. Never miss a critical alert again.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              {!user && (
                <>
                  <Link
                    href="/signup"
                    className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 justify-center"
                  >
                    Start Free Trial
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    href="/login"
                    className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300 flex items-center gap-2 justify-center"
                  >
                    <LogIn className="w-5 h-5" />
                    Sign In
                  </Link>
                </>
              )}
              {user && (
                <Link
                  href="/dashboard"
                  className="group px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-105 flex items-center gap-2 justify-center"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Go to Dashboard
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {[
                { label: "Active Users", value: "10,000+", icon: Users },
                { label: "Alerts Processed", value: "1M+", icon: Activity },
                { label: "Response Time", value: "< 2s", icon: Zap },
                { label: "Uptime", value: "99.99%", icon: CheckCircle2 },
              ].map((stat, idx) => (
                <div key={idx} className="text-center group">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <stat.icon className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              Powerful Features for Modern Teams
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Everything you need to manage alerts efficiently and keep your team synchronized
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "Role-Based Access",
                description: "SysAdmin, AccountAdmin, AccountUser, and AccountObserver roles with granular permissions",
                icon: Shield,
                color: "from-blue-500 to-cyan-500"
              },
              {
                title: "Smart Alert Routing",
                description: "Automatic alert distribution based on user roles and organization hierarchy",
                icon: Target,
                color: "from-purple-500 to-pink-500"
              },
              {
                title: "Real-time Notifications",
                description: "Instant alerts via email, push notifications, and webhooks",
                icon: Bell,
                color: "from-orange-500 to-red-500"
              },
              {
                title: "Organization Management",
                description: "Create and manage multiple organizations with domain-based grouping",
                icon: Building2,
                color: "from-green-500 to-emerald-500"
              },
              {
                title: "Invite System",
                description: "Invite users with specific roles via email with secure OTP verification",
                icon: Mail,
                color: "from-yellow-500 to-orange-500"
              },
              {
                title: "Analytics Dashboard",
                description: "Comprehensive insights into alert patterns and team performance",
                icon: BarChart3,
                color: "from-indigo-500 to-purple-500"
              }
            ].map((feature, idx) => (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105 group"
              >
                <div className={`w-12 h-12 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl p-12 border border-white/10 backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-white mb-4">
              Ready to Transform Your Alert Management?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Join thousands of teams already using AlertFlow to streamline their alert workflow
            </p>
            {!user && (
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full text-white font-semibold text-lg hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300"
              >
                Get Started Now
                <ChevronRight className="w-5 h-5" />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <span className="text-white font-semibold">AlertFlow</span>
              <span className="text-gray-500 text-sm ml-2">© 2024</span>
            </div>
            <div className="flex gap-6">
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Contact</Link>
              <Link href="#" className="text-gray-400 hover:text-white transition-colors">Status</Link>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}