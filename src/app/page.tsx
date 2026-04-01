"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { 
  Shield, 
  Bell, 
  Users, 
  CheckCircle2,
  Zap,
  ArrowRight,
  MessageCircle,
  CreditCard,
  HousePlug,
  Eye,
  Smartphone,
  Star,
  Lock,
  Clock,
  ChevronRight,
} from "lucide-react";

export default function Home() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const plans = [
    {
      name: "Básico",
      price: "$24.999",
      period: "/mes",
      description: "Perfecto para pequeños negocios",
      features: [
        "Hasta 3 usuarios observadores",
        "Notificaciones en tiempo real",
        "Webhook + REST API",
        "Soporte por email",
        "Dashboard básico"
      ],
      color: "from-gray-600 to-gray-700",
      popular: false
    },
    {
      name: "Profesional",
      price: "$49.999",
      period: "/mes",
      description: "Ideal para negocios en crecimiento",
      features: [
        "Hasta 10 usuarios observadores",
        "Notificaciones multi-dispositivo",
        "Webhook + REST + WebSockets",
        "Soporte prioritario",
        "Analytics avanzado",
        "Exportación de datos"
      ],
      color: "from-blue-600 to-purple-600",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Personalizado",
      period: "",
      description: "Para grandes empresas",
      features: [
        "Usuarios ilimitados",
        "Notificaciones personalizadas",
        "API completa dedicada",
        "Soporte 24/7",
        "Dashboard personalizado",
        "Integraciones a medida",
        "SLA garantizado"
      ],
      color: "from-purple-600 to-pink-600",
      popular: false
    }
  ];

  const features = [
    {
      icon: Shield,
      title: "Verificación Real",
      description: "Confirmación auténtica de pagos recibidos, eliminando comprobantes falsos",
      color: "from-green-500 to-emerald-600"
    },
    {
      icon: Bell,
      title: "Notificaciones Instantáneas",
      description: "Recibe alertas en tiempo real cuando llegan los pagos a tu cuenta",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: Users,
      title: "Múltiples Observadores",
      description: "Invita a tu equipo para que monitoreen los ingresos desde sus dispositivos",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Eye,
      title: "Visibilidad Total",
      description: "Control completo sobre quién puede ver las notificaciones de pagos",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: Smartphone,
      title: "Multiplataforma",
      description: "Recibe alertas en web, móvil y desktop donde necesites",
      color: "from-indigo-500 to-purple-600"
    },
    {
      icon: Lock,
      title: "Seguridad Garantizada",
      description: "Encriptación de extremo a extremo y autenticación segura",
      color: "from-gray-600 to-gray-700"
    }
  ];

  const stats = [
    { value: "99.9%", label: "Uptime Garantizado", icon: CheckCircle2 },
    { value: "< 15s", label: "Tiempo de Notificación", icon: Zap },
    { value: "24/7", label: "Monitoreo Activo", icon: Clock },
    { value: "100%", label: "Precisión Verificada", icon: Shield }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/80 backdrop-blur-xl border-b border-white/10' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-15 h-15 bg-gradient-to-r from-slate-100 to-white rounded-xl flex items-center justify-center">
              <Image 
                src="/assets/logo.png" 
                alt="Pay-Alert" 
                width={60} 
                height={60}
                className="rounded-lg"
              />
            </div>
            <div>
              <span className="text-white font-bold text-xl">Pay</span>
              <span>-</span>
              <span className="text-blue-400 font-bold text-xl">Alert</span>
              <span className="text-gray-400 text-sm ml-1">.com.ar</span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-300 hover:text-white transition-colors">Características</a>
            <a href="#plans" className="text-gray-300 hover:text-white transition-colors">Planes</a>
            <a href="#how" className="text-gray-300 hover:text-white transition-colors">Cómo Funciona</a>
            <a 
              href="https://wa.me/543876295801" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 rounded-full text-white font-medium transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Contactar
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-6 pt-20 pb-32 text-center">
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 bg-green-500/10 backdrop-blur-sm rounded-full px-6 py-3 mb-8 border border-green-500/20">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-400 font-medium">
              Producto Argentino • Integrado con Mercado Pago
            </span>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Nunca más confíes en
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              comprobantes falsos
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Recibe notificaciones <span className="text-blue-400 font-semibold">verificadas y en tiempo real&nbsp;</span> 
             de cada pago que ingresa a tu cuenta de Mercado Pago. 
            Ideal para dueños de negocios y sus equipos.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <a 
              href="https://wa.me/543876295801" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full text-white font-semibold text-lg hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105 flex items-center gap-3 justify-center"
            >
              <MessageCircle className="w-5 h-5" />
              Hablar por WhatsApp
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
            <a 
              href="#features" 
              className="px-8 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white font-semibold text-lg hover:bg-white/20 transition-all duration-300 flex items-center gap-3 justify-center"
            >
              <Star className="w-5 h-5" />
              Ver Características
            </a>
          </div>

          {/* Social Proof */}
          <div className="flex items-center justify-center gap-8 text-gray-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>Notificaciones 100% verificadas</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <span>Alertas instantáneas</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <span>Seguridad garantizada</span>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <stat.icon className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Características que te dan
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                total tranquilidad
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Diseñado específicamente para negocios argentinos que usan Mercado Pago
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => (
              <div
                key={idx}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10 hover:border-white/20 transition-all hover:transform hover:scale-105 group"
              >
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 relative bg-black/30 min-h-screen flex items-center justify-between">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Cómo funciona en
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                3 simples pasos
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Conecta tu Mercado Pago",
                description: "Vincula tu cuenta de Mercado Pago de forma segura con nuestra plataforma",
                icon: HousePlug
              },
              {
                step: "02", 
                title: "Invita a tu equipo",
                description: "Asigna observadores para que reciban las notificaciones",
                icon: Users
              },
              {
                step: "03",
                title: "Recibe alertas verificadas",
                description: "Los asignados reciben notificaciones instantáneas cuando llegan pagos reales",
                icon: Bell
              }
            ].map((step, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl flex flex-col p-8 border border-white/10 hover:border-white/20 transition-all">
                  <div className="flex flex-row gap-12">
                    <div className="w-17 h-17 bg-gradient-to-r from-blue-500 to-purple-700 rounded-md flex items-center justify-center mb-6">
                      <step.icon className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-6xl font-bold text-white mb-4">{step.step}</div>
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                    <p className="text-gray-400">{step.description}</p>
                  </div>
                </div>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-14 transform -translate-y-1/2 z-10">
                    <ChevronRight className="w-15 h-15 text-gray-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="plans" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Planes para cada
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                tamaño de negocio
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Elige el plan perfecto según la cantidad de usuarios que necesites
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`relative bg-white/5 backdrop-blur-sm rounded-2xl border ${
                  plan.popular 
                    ? 'border-blue-500 shadow-2xl shadow-blue-500/20 scale-105' 
                    : 'border-white/10'
                } hover:border-white/20 transition-all`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-1 rounded-full text-sm font-semibold text-white">
                      Más Popular
                    </div>
                  </div>
                )}
                
                <div className="p-8">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                    <p className="text-gray-400 mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold text-white">{plan.price}</span>
                      <span className="text-gray-400">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIdx) => (
                      <li key={featureIdx} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <a 
                    href="https://wa.me/543876295801" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`w-full block text-center px-6 py-3 rounded-full font-semibold transition-all ${
                      plan.popular
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:shadow-blue-500/25'
                        : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
                    }`}
                  >
                    {plan.name === "Enterprise" ? "Contactar Ventas" : "Comenzar Ahora"}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 relative">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl p-12 border border-white/10 backdrop-blur-sm">
            <h2 className="text-4xl font-bold text-white mb-6">
              ¿Listo para eliminar el fraude de comprobantes?
            </h2>
            <p className="text-gray-300 mb-8 text-lg">
              Habla hoy mismo con nuestro equipo y recibe información al instante
            </p>
            <a 
              href="https://wa.me/543876295801" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 rounded-full text-white font-semibold text-lg hover:shadow-lg hover:shadow-green-500/25 transition-all duration-300 transform hover:scale-105"
            >
              <MessageCircle className="w-6 h-6" />
              Chatear por WhatsApp ahora
              <ArrowRight className="w-5 h-5" />
            </a>
            <p className="text-gray-400 mt-4 text-sm">
              Respuesta inmediata • Sin compromiso • 100% argentino
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-white font-semibold">Pay Alert</span>
                <span className="text-gray-400 text-sm ml-1">• {new Date().getFullYear()}</span>
              </div>
            </div>
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <span>Producto Argentino</span>
              <span>•</span>
              <span>Integrado con Mercado Pago</span>
              <span>•</span>
              <a href="https://wa.me/543876295801" className="hover:text-white transition-colors">
                Soporte 24/7
              </a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        .animate-pulse {
          animation: pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .delay-2000 {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}