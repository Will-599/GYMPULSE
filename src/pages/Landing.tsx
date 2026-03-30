import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, ArrowRight, CheckCircle2, Users, Trophy, Shield } from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-brand-black text-brand-text selection:bg-brand-green selection:text-brand-black">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-brand-black/80 backdrop-blur-md border-b border-brand-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center text-brand-black shadow-lg shadow-brand-green/20">
              <Dumbbell size={24} />
            </div>
            <span className="text-2xl font-black tracking-tighter uppercase">Gym<span className="text-brand-green">Pulse</span></span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-muted">
            <a href="#features" className="hover:text-brand-green transition-colors">Funcionalidades</a>
            <a href="#about" className="hover:text-brand-green transition-colors">Sobre</a>
            <a href="#pricing" className="hover:text-brand-green transition-colors">Preços</a>
          </div>

          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-brand-muted hover:text-brand-text transition-colors">
              Área da Academia
            </Link>
            <Link to="/student/login" className="btn-primary py-2 px-6 text-sm">
              Área do Aluno
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-green rounded-full blur-[128px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-brand-green rounded-full blur-[128px] animate-pulse delay-700" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block py-1 px-3 rounded-full bg-brand-green/10 text-brand-green text-xs font-bold uppercase tracking-wider mb-6 border border-brand-green/20">
                O Futuro da Gestão Fitness
              </span>
              <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-8">
                Eleve o nível da sua <span className="text-brand-green">Academia</span>
              </h1>
              <p className="text-xl text-brand-muted mb-10 max-w-2xl mx-auto font-light leading-relaxed">
                A plataforma completa para gestão de alunos, treinos e evolução física. 
                Tudo o que você precisa em um só lugar.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register" className="btn-primary py-4 px-10 text-lg w-full sm:w-auto flex items-center justify-center gap-2">
                  Começar Agora <ArrowRight size={20} />
                </Link>
                <Link to="/student/login" className="w-full sm:w-auto py-4 px-10 rounded-xl border border-brand-border hover:bg-brand-border/50 transition-all text-lg font-medium">
                  Sou Aluno
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-brand-dark/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Users className="text-brand-green" size={32} />,
                title: "Gestão Multi-Tenant",
                desc: "Cada academia possui seu próprio ambiente isolado e seguro."
              },
              {
                icon: <Trophy className="text-brand-green" size={32} />,
                title: "Acompanhamento de Evolução",
                desc: "Gráficos e métricas detalhadas para motivar seus alunos."
              },
              {
                icon: <Shield className="text-brand-green" size={32} />,
                title: "Segurança Total",
                desc: "Dados protegidos com as melhores práticas de segurança do mercado."
              }
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-3xl bg-brand-dark/50 border border-brand-border/40 hover:border-brand-green/30 transition-all group"
              >
                <div className="mb-6 p-4 rounded-2xl bg-brand-black w-fit group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-brand-muted leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-24 border-y border-brand-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2">
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter uppercase mb-6">
                Feito para quem busca <span className="text-brand-green">Resultados</span>
              </h2>
              <div className="space-y-4">
                {[
                  "Interface intuitiva e rápida",
                  "Prescrição de treinos simplificada",
                  "Histórico completo de medidas",
                  "Acesso exclusivo para alunos"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="text-brand-green" size={20} />
                    <span className="text-brand-muted font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="lg:w-1/2 relative">
              <div className="aspect-video rounded-3xl overflow-hidden border border-brand-border/50 shadow-2xl shadow-brand-green/10">
                <img 
                  src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2070&auto=format&fit=crop" 
                  alt="Gym Dashboard"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-brand-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-8 h-8 bg-brand-green rounded-lg flex items-center justify-center text-brand-black">
              <Dumbbell size={18} />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase">Gym<span className="text-brand-green">Pulse</span></span>
          </div>
          <p className="text-brand-muted text-sm">
            © 2026 GymPulse. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
