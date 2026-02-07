"use client";
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from './components/Header';
import Logo from './components/Logo';
import withAuth from './hooks/withAuth';
import AccountDetails from './components/AccountDetails';
import { useAuth } from "@/app/hooks/userAuth";
import { FaFileInvoice, FaObjectGroup, FaFileAlt, FaTags, FaImage } from 'react-icons/fa';

const tools = [
  {
    title: 'Invoice Annotation',
    description: 'Mark key-value pairs in invoices.',
    href: '/invoice-annotation',
    icon: <FaFileInvoice />,
  },
  {
    title: 'Object Detection',
    description: 'Draw bounding boxes over objects in images.',
    href: '/object-detection',
    icon: <FaObjectGroup />,
  },
  {
    title: 'Document Classification',
    description: 'Label documents based on their type.',
    href: '/document-classification',
    icon: <FaFileAlt />,
  },
  {
    title: 'Named Entity Recognition',
    description: 'Identify and classify named entities in text.',
    href: '/name-entity-recognition',
    icon: <FaTags />,
  },
  {
    title: 'Image Segmentation',
    description: 'Segment different parts of an image.',
    href: '/image-segmentation',
    icon: <FaImage />,
  },
];

function Home() {

  const { loggedInUser } = useAuth();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cards = containerRef.current?.querySelectorAll('[data-anim-card]');
    if (!cards) return;

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      cards.forEach(c => c.classList.remove('opacity-0', 'translate-y-8'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-card-enter');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    cards.forEach(card => observer.observe(card));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_25%_20%,#ecfdf5,#e0f2fe_45%,#ffffff)] animate-gradientShift">
      {/* subtle moving gradient overlay with new color scheme */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.45] mix-blend-overlay bg-[linear-gradient(120deg,#99f6e433,#67e8f933,#a5f3fc33,#6ee7b733)] bg-[length:280%_280%] animate-overlayFlow" />

      <Header>
        <Logo />
        <AccountDetails loggedInUser={loggedInUser} />
      </Header>
      <div ref={containerRef} className="relative grid grid-cols-1 md:grid-cols-3 gap-8 px-6 md:px-10 py-16 md:py-20">
        {tools.map((tool, index) => (
          <Link key={tool.title} href={tool.href} passHref>
            <div
              data-anim-card
              style={{ animationDelay: `${index * 90}ms` }}
              className="group opacity-0 translate-y-8 will-change-transform p-6 rounded-xl shadow-sm border border-white/60 backdrop-blur-sm bg-white/80 dark:bg-white/10 dark:border-white/10 relative overflow-hidden transition-all duration-500 hover:shadow-emerald-200/60 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.025] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/50 before:to-white/0 before:opacity-0 group-hover:before:opacity-100 before:transition-opacity after:pointer-events-none after:absolute after:-inset-[1px] after:rounded-[inherit] after:opacity-0 group-hover:after:opacity-100 after:transition-opacity after:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.65),transparent_60%)]"
            >
              <div className="absolute -top-24 -right-24 w-56 h-56 bg-gradient-to-br from-teal-300/25 via-cyan-300/25 to-emerald-300/25 blur-3xl rounded-full scale-0 group-hover:scale-100 transition-transform duration-700" />
              <div className="flex items-center justify-center text-4xl text-teal-600 mb-4 drop-shadow-sm group-hover:scale-110 transition-transform duration-300">
                {tool.icon}
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2 text-center tracking-tight group-hover:text-teal-700 transition-colors">
                {tool.title}
              </h2>
              <p className="text-slate-600 text-center leading-relaxed text-sm group-hover:text-slate-700 transition-colors">
                {tool.description}
              </p>
              <div className="mt-4 flex justify-center">
                <span className="inline-flex items-center gap-1 text-xs font-medium text-teal-600/80 group-hover:text-teal-700">
                  Open
                  <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M12.293 5.293a1 1 0 011.414 0L17 8.586a1 1 0 010 1.414l-3.293 3.293a1 1 0 01-1.414-1.414L13.586 10H5a1 1 0 110-2h8.586l-1.293-1.293a1 1 0 010-1.414z" />
                  </svg>
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <style jsx global>{`
        @keyframes cardEnter {
          0% {opacity:0; transform:translateY(28px) scale(.94) rotateX(8deg); filter:blur(2px)}
          55% {opacity:1; transform:translateY(-6px) scale(1.015)}
          100% {opacity:1; transform:translateY(0) scale(1) rotateX(0); filter:blur(0)}
        }
        .animate-card-enter { animation: cardEnter .75s cubic-bezier(.65,.05,.36,1) forwards; }
        @keyframes gradientShift {
          0% { background-position:0% 50%; }
          50% { background-position:100% 50%; }
          100% { background-position:0% 50%; }
        }
        .animate-gradientShift { animation: gradientShift 28s ease-in-out infinite; }
        @keyframes overlayFlow {
          0% { background-position:0% 0%; }
          50% { background-position:100% 100%; }
          100% { background-position:0% 0%; }
        }
        .animate-overlayFlow { animation: overlayFlow 40s linear infinite; }
        @media (prefers-reduced-motion: reduce) {
          .animate-card-enter, .animate-gradientShift, .animate-overlayFlow { animation: none !important; }
          [data-anim-card] { opacity:1 !important; transform:none !important; }
        }
      `}</style>
    </div>
  );
}

export default withAuth(Home);
