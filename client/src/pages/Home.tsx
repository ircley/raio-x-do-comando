import { FormEvent, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleGauge,
  Clock3,
  Command,
  LockKeyhole,
  Mail,
  MessageCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { captureLead, getSalaDeComandoUrl, trackEvent } from "@/config/integrations";

type Screen = "intro" | "quiz" | "lead" | "result";
type DimensionKey =
  | "ownerDependency"
  | "teamAutonomy"
  | "delegation"
  | "operationControl";

type AnswerOption = {
  label: string;
  detail: string;
  score: number;
};

type Question = {
  id: number;
  eyebrow: string;
  prompt: string;
  support: string;
  dimension: DimensionKey;
  options: AnswerOption[];
};

type Lead = {
  name: string;
  whatsapp: string;
  email: string;
};

type Results = Record<DimensionKey, number> & {
  overall: number;
  stage: Stage;
};

type Stage = {
  name: "DONO OPERADOR" | "CENTRALIZADOR" | "GESTOR" | "NO COMANDO";
  range: string;
  summary: string;
  nextStep: string;
};

const questions: Question[] = [
  {
    id: 1,
    eyebrow: "Presença do dono",
    prompt: "Se você ficar três dias fora, o que acontece com a operação?",
    support: "Considere uma ausência real: sem responder mensagens, aprovar exceções ou reorganizar prioridades.",
    dimension: "ownerDependency",
    options: [
      { label: "Ela praticamente para", detail: "As decisões e entregas mais importantes ficam esperando.", score: 0 },
      { label: "Anda, mas acumula pendências", detail: "O time executa o básico e guarda as exceções para mim.", score: 1 },
      { label: "Segue com alguns check-ins", detail: "A equipe resolve quase tudo, mas ainda precisa de validações.", score: 2 },
      { label: "Continua com segurança", detail: "Existem critérios, responsáveis e visibilidade para seguir sem mim.", score: 3 },
    ],
  },
  {
    id: 2,
    eyebrow: "Decisão na ponta",
    prompt: "Um cliente importante pede uma exceção comercial. Quem decide?",
    support: "Pense no que acontece hoje, não no processo ideal que está no papel.",
    dimension: "delegation",
    options: [
      { label: "Sempre chega até mim", detail: "Mesmo exceções pequenas dependem da minha palavra final.", score: 0 },
      { label: "A equipe sugere, eu aprovo", detail: "O raciocínio existe, mas a decisão continua centralizada.", score: 1 },
      { label: "Há limites claros de decisão", detail: "O time decide dentro de faixas e me aciona nas exceções reais.", score: 2 },
      { label: "O critério está incorporado", detail: "As pessoas decidem com consistência e registram o aprendizado.", score: 3 },
    ],
  },
  {
    id: 3,
    eyebrow: "Capacidade do time",
    prompt: "Quando surge um problema novo, como sua equipe reage?",
    support: "Autonomia não é agir sem critério. É saber pensar antes de escalar.",
    dimension: "teamAutonomy",
    options: [
      { label: "Espera minha orientação", detail: "O problema chega sem análise ou proposta de solução.", score: 0 },
      { label: "Tenta, mas volta rapidamente", detail: "Há iniciativa, porém pouca segurança para sustentar a decisão.", score: 1 },
      { label: "Traz opções e recomendação", detail: "A equipe analisa o cenário antes de pedir ajuda.", score: 2 },
      { label: "Resolve e compartilha o aprendizado", detail: "O time age dentro dos princípios e melhora o sistema.", score: 3 },
    ],
  },
  {
    id: 4,
    eyebrow: "Visibilidade da operação",
    prompt: "Para saber se a empresa está bem hoje, de onde vêm as informações?",
    support: "Considere vendas, entregas, caixa, qualidade e principais riscos.",
    dimension: "operationControl",
    options: [
      { label: "Eu preciso perguntar para cada pessoa", detail: "A leitura depende de conversas e memória.", score: 0 },
      { label: "Recebo planilhas e mensagens soltas", detail: "Há dados, mas eles chegam fragmentados e atrasados.", score: 1 },
      { label: "Tenho rituais e indicadores definidos", detail: "Consigo enxergar desvios em uma cadência previsível.", score: 2 },
      { label: "A gestão é visível e orientada a sinais", detail: "Indicadores, responsáveis e ações corretivas estão conectados.", score: 3 },
    ],
  },
  {
    id: 5,
    eyebrow: "Delegação real",
    prompt: "Quando você delega uma responsabilidade importante, o que normalmente ocorre?",
    support: "Delegar uma tarefa alivia a agenda. Delegar um resultado aumenta a capacidade da empresa.",
    dimension: "delegation",
    options: [
      { label: "Eu acabo refazendo", detail: "O padrão final ainda depende diretamente de mim.", score: 0 },
      { label: "Preciso acompanhar cada etapa", detail: "A entrega acontece, mas exige muita supervisão.", score: 1 },
      { label: "Alinho o resultado e pontos de controle", detail: "Existe autonomia com marcos claros de acompanhamento.", score: 2 },
      { label: "A pessoa assume resultado e aprendizado", detail: "Responsabilidade, critério e melhoria ficam com o dono do processo.", score: 3 },
    ],
  },
  {
    id: 6,
    eyebrow: "Agenda executiva",
    prompt: "Quanto da sua semana é consumido por urgências operacionais?",
    support: "Considere interrupções, aprovações, cobranças e correções que só acontecem quando você entra.",
    dimension: "ownerDependency",
    options: [
      { label: "Quase toda a semana", detail: "Minha agenda é definida pelos problemas do dia.", score: 0 },
      { label: "Mais da metade", detail: "Consigo planejar, mas a operação frequentemente toma o espaço.", score: 1 },
      { label: "Uma parte controlada", detail: "Há blocos protegidos para gestão, pessoas e futuro.", score: 2 },
      { label: "Apenas exceções relevantes", detail: "Minha energia está concentrada em direção, pessoas-chave e decisões de alto impacto.", score: 3 },
    ],
  },
  {
    id: 7,
    eyebrow: "Sistema operacional",
    prompt: "Os processos críticos existem além da cabeça das pessoas?",
    support: "Documentação útil orienta decisões; não é um arquivo que ninguém consulta.",
    dimension: "operationControl",
    options: [
      { label: "Estão principalmente na minha cabeça", detail: "Eu sou a referência para explicar como as coisas funcionam.", score: 0 },
      { label: "Alguns estão documentados", detail: "A prática ainda varia muito conforme a pessoa.", score: 1 },
      { label: "Os principais são claros e usados", detail: "O time encontra padrões, responsáveis e critérios de qualidade.", score: 2 },
      { label: "São vivos, medidos e melhorados", detail: "O processo evolui com dados e aprendizado da equipe.", score: 3 },
    ],
  },
  {
    id: 8,
    eyebrow: "Erro e aprendizado",
    prompt: "Quando alguém erra uma decisão, o que acontece depois?",
    support: "A resposta ao erro mostra se a empresa desenvolve autonomia ou reforça dependência.",
    dimension: "teamAutonomy",
    options: [
      { label: "Eu volto a assumir", detail: "Para evitar novo erro, a decisão retorna para mim.", score: 0 },
      { label: "A pessoa perde espaço para decidir", detail: "A correção acontece, mas a confiança demora a voltar.", score: 1 },
      { label: "Revisamos critério e contexto", detail: "O erro vira uma conversa objetiva de desenvolvimento.", score: 2 },
      { label: "Ajustamos o sistema e seguimos", detail: "O aprendizado é incorporado sem retirar responsabilidade.", score: 3 },
    ],
  },
  {
    id: 9,
    eyebrow: "Ritmo de gestão",
    prompt: "Como prioridades e resultados são acompanhados pela liderança?",
    support: "O objetivo é manter comando sem depender de cobrança constante.",
    dimension: "operationControl",
    options: [
      { label: "Quando algo sai do controle", detail: "O acompanhamento é reativo e guiado por urgências.", score: 0 },
      { label: "Em reuniões longas e pouco objetivas", detail: "Há cadência, mas falta foco em decisão e compromisso.", score: 1 },
      { label: "Com rituais curtos e indicadores", detail: "As prioridades são revistas e os desvios têm responsáveis.", score: 2 },
      { label: "Com gestão por exceção", detail: "O sistema mostra onde agir; não preciso vigiar tudo.", score: 3 },
    ],
  },
  {
    id: 10,
    eyebrow: "Teste definitivo",
    prompt: "Hoje, qual frase melhor descreve a relação entre você e a empresa?",
    support: "Escolha a alternativa mais honesta. Este é o retrato atual, não uma sentença definitiva.",
    dimension: "ownerDependency",
    options: [
      { label: "Se eu desacelerar, a empresa desacelera", detail: "Minha presença ainda sustenta o ritmo da operação.", score: 0 },
      { label: "Eu sou o ponto de conexão de quase tudo", detail: "As áreas funcionam, mas convergem para mim.", score: 1 },
      { label: "Eu direciono mais do que executo", detail: "A empresa tem autonomia, com dependências pontuais.", score: 2 },
      { label: "Eu mantenho comando sem virar gargalo", detail: "Tenho clareza, time responsável e controle por sistema.", score: 3 },
    ],
  },
];

const stages: Stage[] = [
  {
    name: "DONO OPERADOR",
    range: "Operação dependente",
    summary:
      "Hoje, você ainda funciona como o principal sistema operacional da empresa. Sua presença destrava decisões, mantém o ritmo e protege a qualidade — mas também limita a capacidade de escala.",
    nextStep:
      "Tirar da sua cabeça as decisões recorrentes e escolher uma primeira responsabilidade para transferir por inteiro.",
  },
  {
    name: "CENTRALIZADOR",
    range: "Autonomia em construção",
    summary:
      "A empresa já possui pessoas capazes, mas decisões, prioridades e informações ainda convergem para você. O time executa; você continua conectando as partes.",
    nextStep:
      "Definir alçadas de decisão e criar uma cadência de gestão que substitua a supervisão constante.",
  },
  {
    name: "GESTOR",
    range: "Gestão estruturada",
    summary:
      "A operação já anda com autonomia relevante. Seu próximo salto está em consolidar critérios, desenvolver líderes e transformar acompanhamento em gestão por exceção.",
    nextStep:
      "Fortalecer os pontos de controle e elevar a qualidade das decisões que já acontecem sem você.",
  },
  {
    name: "NO COMANDO",
    range: "Autonomia com controle",
    summary:
      "Você mantém visão e direção sem precisar ocupar todas as decisões. A empresa funciona por critérios, responsáveis e ritmos de gestão — não pela sua presença constante.",
    nextStep:
      "Proteger o sistema de gestão, desenvolver a próxima camada de liderança e concentrar sua energia nas decisões de futuro.",
  },
];

const dimensionMeta: Record<
  DimensionKey,
  { label: string; short: string; description: string; inverse?: boolean }
> = {
  ownerDependency: {
    label: "Dependência do Dono",
    short: "Dependência",
    description: "Quanto a operação ainda precisa da sua presença para manter ritmo e decisão.",
    inverse: true,
  },
  teamAutonomy: {
    label: "Autonomia da Equipe",
    short: "Autonomia",
    description: "Capacidade do time de analisar, decidir e aprender sem paralisar.",
  },
  delegation: {
    label: "Delegação & Decisão",
    short: "Delegação",
    description: "Clareza de responsabilidade, alçadas e critérios para decidir.",
  },
  operationControl: {
    label: "Controle da Operação",
    short: "Controle",
    description: "Visibilidade, processos e rituais que mantêm a empresa no rumo.",
  },
};

const transition = { duration: 0.24, ease: [0.23, 1, 0.32, 1] as const };

function Brand({ light = false }: { light?: boolean }) {
  return (
    <div className="brand-lockup" aria-label="RAIO-X DO COMANDO">
      <div className={`brand-mark ${light ? "brand-mark--light" : ""}`} aria-hidden="true">
        <span />
        <span />
      </div>
      <div>
        <span className={`brand-name ${light ? "text-white" : "text-[#101828]"}`}>RAIO-X</span>
        <span className={`brand-sub ${light ? "text-white/55" : "text-[#667085]"}`}>DO COMANDO</span>
      </div>
    </div>
  );
}

function Header({ dark = false }: { dark?: boolean }) {
  return (
    <header className="relative z-20 flex items-center justify-between px-5 py-5 sm:px-8 lg:px-12">
      <Brand light={dark} />
      <div className={`hidden items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] sm:flex ${dark ? "text-white/45" : "text-[#667085]"}`}>
        <LockKeyhole className="h-3.5 w-3.5" />
        Diagnóstico confidencial
      </div>
    </header>
  );
}

function IntroScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      className="intro-shell min-h-screen overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition}
    >
      <Header />
      <main className="relative z-10 grid min-h-[calc(100vh-86px)] grid-cols-1 items-center gap-10 px-5 pb-10 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:px-12 lg:pb-14">
        <section className="mx-auto w-full max-w-[760px] lg:mx-0 lg:pl-[max(0px,calc((100vw-1440px)/2))]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.05 }}
            className="mb-6 flex items-center gap-3"
          >
            <span className="eyebrow-line" />
            <span className="eyebrow">Diagnóstico executivo • 2 minutos</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.1 }}
            className="display-title max-w-[780px] text-[clamp(3.2rem,7vw,6.75rem)] leading-[0.92] tracking-[-0.055em] text-[#0a1733]"
          >
            Quanto sua empresa ainda <em>depende</em> de você?
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.16 }}
            className="mt-7 max-w-xl text-base leading-7 text-[#4b5565] sm:text-lg sm:leading-8"
          >
            Descubra em menos de 2 minutos onde está o principal gargalo para construir autonomia sem perder o comando.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...transition, delay: 0.22 }}
            className="mt-9 flex flex-col items-start gap-5 sm:flex-row sm:items-center"
          >
            <Button className="premium-cta h-14 rounded-full bg-[#0a1733] px-7 text-[15px] font-bold text-white shadow-[0_16px_34px_rgba(10,23,51,0.18)] hover:bg-[#12264f]" onClick={onStart}>
              Fazer meu Raio-X
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3 text-sm text-[#667085]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d9d2c4] bg-white/65">
                <Clock3 className="h-4 w-4 text-[#aa8a4c]" />
              </span>
              10 perguntas objetivas
            </div>
          </motion.div>
        </section>

        <motion.aside
          initial={{ opacity: 0, x: 22 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...transition, delay: 0.14 }}
          className="relative mx-auto hidden aspect-[0.88] w-full max-w-[560px] lg:block"
        >
          <div className="radar-card absolute inset-0 overflow-hidden rounded-[2.5rem] bg-[#07142f] shadow-[0_38px_90px_rgba(10,23,51,0.22)]">
            <div className="radar-orbit radar-orbit--one" />
            <div className="radar-orbit radar-orbit--two" />
            <div className="radar-sweep" />
            <div className="absolute left-8 top-8 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-white/60 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d7b66f] shadow-[0_0_14px_#d7b66f]" />
              Sistema de leitura
            </div>
            <div className="absolute inset-x-8 bottom-8 rounded-[1.6rem] border border-white/10 bg-[#0c1c3b]/80 p-6 backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d7b66f]">4 dimensões analisadas</p>
              <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
                {["Dependência", "Autonomia", "Delegação", "Controle"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 border-t border-white/10 pt-3">
                    <span className="text-[10px] font-bold text-white/35">0{index + 1}</span>
                    <span className="text-sm font-semibold text-white/85">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute -left-8 top-[42%] max-w-[230px] rounded-2xl border border-[#e5dfd1] bg-[#fbfaf6]/95 p-5 shadow-[0_18px_45px_rgba(10,23,51,0.12)] backdrop-blur-xl">
            <CircleGauge className="h-5 w-5 text-[#b28d47]" />
            <p className="mt-5 text-lg font-semibold leading-6 text-[#101828]">Autonomia sem perder visibilidade.</p>
          </div>
        </motion.aside>
      </main>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#b28d47]/35 to-transparent" />
    </motion.div>
  );
}

function QuizScreen({
  questionIndex,
  answers,
  onAnswer,
  onBack,
  isAdvancing,
}: {
  questionIndex: number;
  answers: Record<number, number>;
  onAnswer: (score: number) => void;
  onBack: () => void;
  isAdvancing: boolean;
}) {
  const question = questions[questionIndex];
  const selected = answers[question.id];
  const progress = ((questionIndex + 1) / questions.length) * 100;
  const remaining = questions.length - questionIndex - 1;

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const optionIndex = Number(event.key) - 1;
      if (optionIndex >= 0 && optionIndex < question.options.length && !isAdvancing) {
        onAnswer(question.options[optionIndex].score);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [question, isAdvancing, onAnswer]);

  return (
    <motion.div
      className="quiz-shell min-h-screen bg-[#f4f1e9]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition}
    >
      <Header />
      <div className="fixed left-0 right-0 top-[77px] z-20 h-[3px] bg-[#e5dfd1]">
        <motion.div
          className="h-full bg-gradient-to-r from-[#b28d47] to-[#e0c98e]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>

      <main className="mx-auto grid min-h-[calc(100vh-86px)] max-w-[1440px] grid-cols-1 gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20 lg:px-12 lg:py-14">
        <section className="flex flex-col justify-between">
          <div>
            <button
              onClick={onBack}
              className="group mb-10 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#667085] transition-colors hover:text-[#0a1733]"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Voltar
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={transition}
              >
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-[#0a1733] px-2 text-[11px] font-bold text-white">
                    {String(questionIndex + 1).padStart(2, "0")}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a17f3e]">{question.eyebrow}</span>
                </div>
                <h2 className="display-title max-w-[600px] text-[clamp(2.45rem,5vw,4.7rem)] leading-[0.98] tracking-[-0.045em] text-[#0a1733]">
                  {question.prompt}
                </h2>
                <p className="mt-6 max-w-lg text-sm leading-6 text-[#667085] sm:text-base sm:leading-7">{question.support}</p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-12 hidden items-end justify-between border-t border-[#d9d2c4] pt-5 text-xs text-[#8a8f99] lg:flex">
            <span>Use as teclas 1–4 para responder</span>
            <span>
              {remaining === 0
                ? "Última pergunta"
                : `${remaining} ${remaining === 1 ? "pergunta restante" : "perguntas restantes"}`}
            </span>
          </div>
        </section>

        <section className="flex items-center">
          <div className="w-full space-y-3">
            {question.options.map((option, index) => {
              const isSelected = selected === option.score;
              return (
                <motion.button
                  key={`${question.id}-${option.score}`}
                  type="button"
                  disabled={isAdvancing}
                  onClick={() => onAnswer(option.score)}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ...transition, delay: index * 0.045 }}
                  className={`answer-card group relative flex w-full items-start gap-4 overflow-hidden rounded-2xl border p-5 text-left sm:p-6 ${
                    isSelected
                      ? "border-[#0a1733] bg-[#0a1733] text-white shadow-[0_18px_40px_rgba(10,23,51,0.18)]"
                      : "border-[#ddd7ca] bg-white/72 text-[#101828] hover:-translate-y-0.5 hover:border-[#b8aa8d] hover:bg-white hover:shadow-[0_14px_32px_rgba(10,23,51,0.08)]"
                  }`}
                >
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-[11px] font-bold ${isSelected ? "border-[#d7b66f] bg-[#d7b66f] text-[#0a1733]" : "border-[#d9d2c4] bg-[#f8f6f0] text-[#7f7562] group-hover:border-[#b28d47]"}`}>
                    {isSelected ? <Check className="h-4 w-4" /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-bold sm:text-base">{option.label}</span>
                    <span className={`mt-1.5 block text-sm leading-5 ${isSelected ? "text-white/62" : "text-[#667085]"}`}>{option.detail}</span>
                  </span>
                  <ChevronRight className={`mt-1 h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 ${isSelected ? "text-[#d7b66f]" : "text-[#b2b7c0]"}`} />
                </motion.button>
              );
            })}
          </div>
        </section>
      </main>
    </motion.div>
  );
}

function LeadScreen({
  lead,
  setLead,
  onSubmit,
  onBack,
  isSubmitting,
}: {
  lead: Lead;
  setLead: (lead: Lead) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onBack: () => void;
  isSubmitting: boolean;
}) {
  return (
    <motion.div
      className="lead-shell min-h-screen bg-[#07142f] text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition}
    >
      <Header dark />
      <main className="mx-auto grid min-h-[calc(100vh-86px)] max-w-[1400px] grid-cols-1 gap-10 px-5 py-10 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-20 lg:px-12 lg:py-14">
        <section>
          <button onClick={onBack} className="group mb-9 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-white/45 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Rever resposta
          </button>
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#d7b66f]/35 bg-[#d7b66f]/10 text-[#e1c88e]">
              <CheckCircle2 className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#d7b66f]">Leitura concluída</span>
          </div>
          <h2 className="display-title max-w-xl text-[clamp(2.8rem,5vw,5rem)] leading-[0.96] tracking-[-0.045em] text-white">
            Seu diagnóstico está <em className="text-[#d7b66f]">pronto.</em>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-white/55">
            Informe seus dados para revelar seu estágio, o indicador de cada dimensão e o ponto de alavanca mais importante agora.
          </p>

          <div className="mt-10 grid max-w-lg grid-cols-2 gap-3 sm:grid-cols-3">
            {["Estágio atual", "4 indicadores", "Próximo passo"].map((item, index) => (
              <div key={item} className={`rounded-2xl border border-white/10 bg-white/[0.045] p-4 ${index === 2 ? "col-span-2 sm:col-span-1" : ""}`}>
                <span className="block text-[10px] font-bold text-[#d7b66f]">0{index + 1}</span>
                <span className="mt-3 block text-sm font-semibold text-white/80">{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <form onSubmit={onSubmit} className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white p-6 text-[#101828] shadow-[0_32px_80px_rgba(0,0,0,0.28)] sm:p-9 lg:p-11">
            <div className="absolute right-0 top-0 h-32 w-32 rounded-bl-[6rem] bg-[#f1eadb]" />
            <div className="relative z-10">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a17f3e]">Acesso ao resultado</p>
              <h3 className="mt-3 text-2xl font-bold tracking-[-0.035em] text-[#0a1733] sm:text-3xl">Para quem devemos enviar esta leitura?</h3>

              <div className="mt-8 space-y-5">
                <label className="field-label">
                  <span>Nome</span>
                  <div className="field-wrap">
                    <UserRound className="field-icon" />
                    <Input
                      required
                      autoComplete="name"
                      value={lead.name}
                      onChange={(event) => setLead({ ...lead, name: event.target.value })}
                      placeholder="Seu nome"
                      className="premium-input"
                    />
                  </div>
                </label>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className="field-label">
                    <span>WhatsApp</span>
                    <div className="field-wrap">
                      <MessageCircle className="field-icon" />
                      <Input
                        required
                        inputMode="tel"
                        autoComplete="tel"
                        value={lead.whatsapp}
                        onChange={(event) => setLead({ ...lead, whatsapp: formatPhone(event.target.value) })}
                        placeholder="(11) 99999-9999"
                        className="premium-input"
                      />
                    </div>
                  </label>

                  <label className="field-label">
                    <span>E-mail</span>
                    <div className="field-wrap">
                      <Mail className="field-icon" />
                      <Input
                        required
                        type="email"
                        autoComplete="email"
                        value={lead.email}
                        onChange={(event) => setLead({ ...lead, email: event.target.value })}
                        placeholder="voce@empresa.com"
                        className="premium-input"
                      />
                    </div>
                  </label>
                </div>
              </div>

              <Button disabled={isSubmitting} type="submit" className="premium-cta mt-7 h-14 w-full rounded-full bg-[#0a1733] text-[15px] font-bold text-white hover:bg-[#12264f]">
                {isSubmitting ? "Gerando seu diagnóstico..." : "Ver meu diagnóstico"}
                {!isSubmitting && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
              <p className="mt-4 flex items-start justify-center gap-2 text-center text-[11px] leading-5 text-[#8a8f99]">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#a17f3e]" />
                Seus dados serão usados para enviar o diagnóstico e os próximos passos.
              </p>
            </div>
          </form>
        </section>
      </main>
    </motion.div>
  );
}

function DimensionGauge({
  dimension,
  value,
  index,
}: {
  dimension: DimensionKey;
  value: number;
  index: number;
}) {
  const meta = dimensionMeta[dimension];
  const status = getDimensionStatus(dimension, value);
  const visualValue = dimension === "ownerDependency" ? 100 - value : value;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...transition, delay: 0.08 + index * 0.05 }}
      className="rounded-2xl border border-[#e5dfd1] bg-white p-5 shadow-[0_12px_28px_rgba(10,23,51,0.055)] sm:p-6"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9a7b41]">{String(index + 1).padStart(2, "0")}</p>
          <h4 className="mt-2 text-[15px] font-bold text-[#17213a]">{meta.label}</h4>
        </div>
        <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${status.className}`}>{status.label}</span>
      </div>
      <div className="mt-5 flex items-end justify-between gap-4">
        <span className="text-4xl font-semibold tracking-[-0.05em] text-[#0a1733]">{value}<small className="ml-0.5 text-sm text-[#9aa0aa]">%</small></span>
        <span className="pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9aa0aa]">
          {dimension === "ownerDependency" ? "risco" : "maturidade"}
        </span>
      </div>
      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#eee9df]">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#b28d47] via-[#28558f] to-[#0a1733]"
          initial={{ width: 0 }}
          animate={{ width: `${visualValue}%` }}
          transition={{ duration: 0.7, delay: 0.18 + index * 0.06, ease: [0.23, 1, 0.32, 1] }}
        />
      </div>
      <p className="mt-4 text-xs leading-5 text-[#667085]">{meta.description}</p>
    </motion.div>
  );
}

function ResultScreen({ results, lead, onRestart }: { results: Results; lead: Lead; onRestart: () => void }) {
  const attentionPoints = useMemo(() => getAttentionPoints(results), [results]);
  const salaDeComandoUrl = getSalaDeComandoUrl();
  const circumference = 2 * Math.PI * 76;
  const progressOffset = circumference - (results.overall / 100) * circumference;

  return (
    <motion.div
      className="min-h-screen bg-[#f4f1e9] text-[#101828]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={transition}
    >
      <section className="result-hero relative overflow-hidden bg-[#07142f] text-white">
        <Header dark />
        <div className="result-asset" aria-hidden="true" />
        <div className="relative z-10 mx-auto grid max-w-[1400px] grid-cols-1 items-center gap-10 px-5 pb-14 pt-7 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20 lg:px-12 lg:pb-20 lg:pt-10">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={transition}>
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#d7b66f]">
              <span className="h-px w-8 bg-[#d7b66f]" />
              Diagnóstico de {lead.name.split(" ")[0] || "liderança"}
            </div>
            <p className="mt-8 text-sm font-medium text-white/48">Seu estágio atual é</p>
            <h1 className="mt-2 text-[clamp(2.8rem,7vw,6.5rem)] font-extrabold leading-[0.88] tracking-[-0.065em] text-white">
              {results.stage.name}
            </h1>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[#d7b66f]/30 bg-[#d7b66f]/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[#e1c88e]">{results.stage.range}</span>
              <span className="text-xs text-white/40">Leitura concluída em 4 dimensões</span>
            </div>
            <p className="mt-7 max-w-2xl text-base leading-7 text-white/65 sm:text-lg sm:leading-8">{results.stage.summary}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ ...transition, delay: 0.1 }} className="relative mx-auto flex aspect-square w-full max-w-[340px] items-center justify-center">
            <div className="absolute inset-7 rounded-full border border-white/10" />
            <div className="absolute inset-1 rounded-full border border-dashed border-white/10" />
            <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180" aria-label={`Índice de Autonomia ${results.overall}%`}>
              <circle cx="90" cy="90" r="76" fill="none" stroke="rgba(255,255,255,.09)" strokeWidth="4" />
              <motion.circle
                cx="90"
                cy="90"
                r="76"
                fill="none"
                stroke="url(#scoreGradient)"
                strokeLinecap="round"
                strokeWidth="5"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: progressOffset }}
                transition={{ duration: 1, delay: 0.18, ease: [0.23, 1, 0.32, 1] }}
              />
              <defs>
                <linearGradient id="scoreGradient" x1="0" x2="1">
                  <stop offset="0%" stopColor="#d7b66f" />
                  <stop offset="100%" stopColor="#f4e6bd" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute text-center">
              <span className="block text-[4.2rem] font-semibold leading-none tracking-[-0.07em] text-white">{results.overall}</span>
              <span className="mt-2 block text-[10px] font-bold uppercase tracking-[0.2em] text-white/42">Índice de autonomia</span>
            </div>
          </motion.div>
        </div>
      </section>

      <main className="mx-auto max-w-[1400px] px-5 py-12 sm:px-8 lg:px-12 lg:py-20">
        <section>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a17f3e]">Leitura das dimensões</p>
              <h2 className="mt-3 text-3xl font-bold tracking-[-0.045em] text-[#0a1733] sm:text-4xl">Onde o comando está concentrado.</h2>
            </div>
            <p className="max-w-md text-sm leading-6 text-[#667085]">Dependência mede risco: quanto menor, melhor. As demais dimensões medem maturidade: quanto maior, melhor.</p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(Object.keys(dimensionMeta) as DimensionKey[]).map((dimension, index) => (
              <DimensionGauge key={dimension} dimension={dimension} value={results[dimension]} index={index} />
            ))}
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-6 lg:mt-16 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-[0_18px_45px_rgba(10,23,51,0.06)] sm:p-9">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f1eadb] text-[#9a7b41]"><BarChart3 className="h-5 w-5" /></span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#a17f3e]">Pontos de atenção</p>
                <h3 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#0a1733]">O que mais limita sua autonomia agora</h3>
              </div>
            </div>
            <div className="mt-7 space-y-4">
              {attentionPoints.map((point, index) => (
                <div key={point.title} className="flex gap-4 rounded-2xl border border-[#ebe6dc] bg-[#faf8f3] p-5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0a1733] text-[10px] font-bold text-white">{index + 1}</span>
                  <div>
                    <h4 className="text-sm font-bold text-[#17213a]">{point.title}</h4>
                    <p className="mt-1 text-sm leading-6 text-[#667085]">{point.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="quote-card relative flex min-h-[360px] flex-col justify-between overflow-hidden rounded-[2rem] bg-[#d9b96f] p-7 text-[#0a1733] sm:p-9">
            <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full border border-[#0a1733]/10" />
            <div className="absolute -right-5 -top-5 h-32 w-32 rounded-full border border-[#0a1733]/10" />
            <Sparkles className="h-6 w-6" />
            <blockquote className="display-title relative z-10 mt-14 text-[clamp(2.15rem,4vw,3.5rem)] leading-[1.02] tracking-[-0.04em]">
              “O problema não é você estar na operação. É a operação <em>precisar</em> de você.”
            </blockquote>
            <p className="mt-8 text-[10px] font-bold uppercase tracking-[0.2em] text-[#0a1733]/55">Princípio do comando</p>
          </div>
        </section>

        <section className="mt-6 overflow-hidden rounded-[2rem] bg-[#0a1733] text-white shadow-[0_30px_70px_rgba(10,23,51,0.18)] lg:mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px]">
            <div className="p-7 sm:p-10 lg:p-14">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#d7b66f]">Seu próximo passo</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-bold tracking-[-0.045em] sm:text-4xl">Seu diagnóstico é só o começo.</h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/60">{results.stage.nextStep}</p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-white/55">Toda semana, a Sala de Comando reúne empresários e gestores em uma aula gratuita para construir mais autonomia sem perder o controle da operação.</p>
              <a
                href={salaDeComandoUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackEvent("sala_comando_group_clicked", { stage: results.stage.name, score: results.overall })}
                className="premium-cta mt-8 inline-flex h-14 items-center justify-center rounded-full bg-[#d7b66f] px-7 text-[15px] font-bold text-[#0a1733] shadow-[0_14px_30px_rgba(215,182,111,0.18)] transition-colors hover:bg-[#e5cb91]"
              >
                Entrar gratuitamente na Sala de Comando
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
            <aside className="border-t border-white/10 bg-white/[0.04] p-7 lg:border-l lg:border-t-0 lg:p-8">
              <div className="flex h-full min-h-[250px] flex-col items-center justify-center rounded-2xl border border-white/10 bg-black/10 p-6 text-center">
                <img src="/ircley-oficial.jpeg" alt="Ircley Oliveira" className="h-28 w-28 rounded-full object-cover object-top ring-2 ring-[#d7b66f]/50" />
                <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#d7b66f]">Sala de Comando</p>
                <p className="mt-2 text-base font-bold">Ircley Oliveira</p>
                <p className="mt-2 text-xs leading-5 text-white/42">Aula gratuita semanal para empresários e gestores.</p>
              </div>
            </aside>
          </div>
        </section>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[#d9d2c4] pt-6 sm:flex-row">
          <p className="text-xs text-[#8a8f99]">Este diagnóstico é orientativo e reflete as respostas informadas.</p>
          <button onClick={onRestart} className="group flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#5f6673] hover:text-[#0a1733]">
            <RotateCcw className="h-3.5 w-3.5 transition-transform group-hover:-rotate-45" />
            Refazer diagnóstico
          </button>
        </div>
      </main>
    </motion.div>
  );
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function calculateResults(answers: Record<number, number>): Results {
  const dimensionMaturity = {} as Record<DimensionKey, number>;

  (Object.keys(dimensionMeta) as DimensionKey[]).forEach((dimension) => {
    const dimensionQuestions = questions.filter((question) => question.dimension === dimension);
    const total = dimensionQuestions.reduce((sum, question) => sum + (answers[question.id] ?? 0), 0);
    dimensionMaturity[dimension] = Math.round((total / (dimensionQuestions.length * 3)) * 100);
  });

  const ownerDependency = 100 - dimensionMaturity.ownerDependency;
  const teamAutonomy = dimensionMaturity.teamAutonomy;
  const delegation = dimensionMaturity.delegation;
  const operationControl = dimensionMaturity.operationControl;
  const overall = Math.round((100 - ownerDependency + teamAutonomy + delegation + operationControl) / 4);
  const stage = overall < 30 ? stages[0] : overall < 50 ? stages[1] : overall < 75 ? stages[2] : stages[3];

  return { ownerDependency, teamAutonomy, delegation, operationControl, overall, stage };
}

function getDimensionStatus(dimension: DimensionKey, value: number) {
  const health = dimension === "ownerDependency" ? 100 - value : value;
  if (health < 35) return { label: "Crítico", className: "bg-[#f7e8e2] text-[#9b3f2b]" };
  if (health < 60) return { label: "Atenção", className: "bg-[#f4ead5] text-[#8b6424]" };
  if (health < 80) return { label: "Consistente", className: "bg-[#e7edf4] text-[#345173]" };
  return { label: "Forte", className: "bg-[#e0eee9] text-[#2e6954]" };
}

function getAttentionPoints(results: Results) {
  const points: Record<DimensionKey, string> = {
    ownerDependency:
      "Sua presença ainda concentra ritmo e resolução. O primeiro movimento é transformar decisões recorrentes em critérios que o time possa usar.",
    teamAutonomy:
      "A equipe precisa chegar aos problemas com análise e recomendação. Isso desenvolve repertório sem retirar seu controle.",
    delegation:
      "Delegar tarefas não basta. Defina resultado esperado, limite de decisão e pontos de controle para transferir responsabilidade de verdade.",
    operationControl:
      "Substitua a cobrança dispersa por poucos indicadores e rituais objetivos. Visibilidade reduz a necessidade de vigilância.",
  };

  return (Object.keys(dimensionMeta) as DimensionKey[])
    .map((dimension) => ({
      dimension,
      health: dimension === "ownerDependency" ? 100 - results.ownerDependency : results[dimension],
      title: dimensionMeta[dimension].label,
      text: points[dimension],
    }))
    .sort((a, b) => a.health - b.health)
    .slice(0, 3);
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [lead, setLead] = useState<Lead>({ name: "", whatsapp: "", email: "" });
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const results = useMemo(() => calculateResults(answers), [answers]);

  const startQuiz = () => {
    trackEvent("diagnostic_started");
    setScreen("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAnswer = (score: number) => {
    if (isAdvancing) return;
    const question = questions[questionIndex];
    setAnswers((current) => ({ ...current, [question.id]: score }));
    setIsAdvancing(true);

    window.setTimeout(() => {
      if (questionIndex === questions.length - 1) {
        setScreen("lead");
        trackEvent("diagnostic_completed");
      } else {
        setQuestionIndex((current) => current + 1);
      }
      setIsAdvancing(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 230);
  };

  const goBack = () => {
    if (questionIndex === 0) {
      setScreen("intro");
    } else {
      setQuestionIndex((current) => current - 1);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (lead.name.trim().length < 2 || lead.whatsapp.replace(/\D/g, "").length < 10 || !lead.email.includes("@")) return;

    setIsSubmitting(true);
    await captureLead({
      lead,
      answers,
      result: {
        stage: results.stage.name,
        overall: results.overall,
        dimensions: {
          ownerDependency: results.ownerDependency,
          teamAutonomy: results.teamAutonomy,
          delegation: results.delegation,
          operationControl: results.operationControl,
        },
      },
      capturedAt: new Date().toISOString(),
    });
    trackEvent("lead_captured", { stage: results.stage.name, score: results.overall });
    setIsSubmitting(false);
    setScreen("result");
    window.scrollTo({ top: 0 });
  };

  const restart = () => {
    setAnswers({});
    setQuestionIndex(0);
    setLead({ name: "", whatsapp: "", email: "" });
    setScreen("intro");
    window.scrollTo({ top: 0, behavior: "smooth" });
    trackEvent("diagnostic_restarted");
  };

  return (
    <AnimatePresence mode="wait">
      {screen === "intro" && <IntroScreen key="intro" onStart={startQuiz} />}
      {screen === "quiz" && (
        <QuizScreen
          key="quiz"
          questionIndex={questionIndex}
          answers={answers}
          onAnswer={handleAnswer}
          onBack={goBack}
          isAdvancing={isAdvancing}
        />
      )}
      {screen === "lead" && (
        <LeadScreen
          key="lead"
          lead={lead}
          setLead={setLead}
          onSubmit={submitLead}
          onBack={() => {
            setQuestionIndex(questions.length - 1);
            setScreen("quiz");
          }}
          isSubmitting={isSubmitting}
        />
      )}
      {screen === "result" && <ResultScreen key="result" results={results} lead={lead} onRestart={restart} />}
    </AnimatePresence>
  );
}
