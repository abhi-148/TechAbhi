
import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  FileText,
  Globe2,
  HeartHandshake,
  Mail,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  UserCheck,
} from 'lucide-react';
import { useMeta } from '../lib/format';

const CONTACT_EMAIL = 'contact@example.com';

const pageContent = {
  about: {
    eyebrow: 'ABOUT TECHABHI',
    title: 'Helping you take the next step in your career.',
    description:
      'A simpler way to discover opportunities, explore career paths, and connect with the jobs that match your goals.',
    icon: Globe2,
  },
  contact: {
    eyebrow: 'GET IN TOUCH',
    title: 'Let’s make things better, together.',
    description:
      'Have a question, spotted an issue, or need to report a listing? We are here to help.',
    icon: MessageCircle,
  },
  privacy: {
    eyebrow: 'YOUR PRIVACY MATTERS',
    title: 'Your data deserves transparency.',
    description:
      'Understand how TechAbhi handles information while you explore job opportunities.',
    icon: ShieldCheck,
  },
  terms: {
    eyebrow: 'PLEASE READ',
    title: 'Clear expectations. Better experiences.',
    description:
      'A few important guidelines for using TechAbhi responsibly and safely.',
    icon: FileText,
  },
};

function PageHero({ page }) {
  const Icon = page.icon;

  return (
    <section className="relative isolate overflow-hidden bg-[#111735]">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,255,255,.4)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.4)_1px,transparent_1px)] [background-size:36px_36px]" />
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-14 lg:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3.5 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={15} />
          Back to home
        </Link>

        <div className="mt-9 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-300/20 bg-indigo-400/10 px-3.5 py-2 text-xs font-bold tracking-wider text-indigo-200">
            <Sparkles size={14} />
            {page.eyebrow}
          </div>

          <h1 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl">
            {page.title}
          </h1>

          <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base">
            {page.description}
          </p>

          <div className="mt-7 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.08] text-indigo-200 shadow-lg">
            <Icon size={23} />
          </div>
        </div>
      </div>
    </section>
  );
}

function ContentCard({ icon: Icon, title, children }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-indigo-100 hover:shadow-md sm:p-7">
      <div className="flex items-start gap-4">
        {Icon && (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Icon size={20} />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            {title}
          </h2>
          <div className="mt-3 space-y-3 text-sm leading-7 text-slate-600">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

function ContactCard() {
  const [copied, setCopied] = useState(false);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(CONTACT_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.location.href = `mailto:${CONTACT_EMAIL}`;
    }
  };

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 sm:p-7">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
        <Mail size={22} />
      </div>

      <h2 className="mt-5 text-xl font-extrabold text-slate-900">
        Contact our team
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        For questions, corrections, feedback, or job listing takedown requests,
        contact us by email.
      </p>

      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="mt-5 flex items-center gap-3 break-all rounded-xl border border-indigo-100 bg-white p-3.5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-300"
      >
        <Mail size={17} className="shrink-0" />
        {CONTACT_EMAIL}
      </a>

      <button
        type="button"
        onClick={copyEmail}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-600/15 transition hover:bg-indigo-700"
      >
        {copied ? <CheckCircle2 size={16} /> : <Mail size={16} />}
        {copied ? 'Email copied' : 'Copy email address'}
      </button>

      <p className="mt-3 text-xs leading-5 text-slate-500">
        Before launch, replace this placeholder with your real support email.
      </p>
    </div>
  );
}

function BottomCTA() {
  return (
    <section className="overflow-hidden rounded-2xl bg-[#111735] p-6 sm:p-8">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-indigo-200">
            <BriefcaseBusiness size={21} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              Ready for your next opportunity?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              Explore available jobs and discover your next career move.
            </p>
          </div>
        </div>

        <Link
          to="/jobs"
          className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-indigo-950 transition hover:bg-indigo-50"
        >
          Explore jobs
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

function PageLayout({ pageKey, children }) {
  const page = pageContent[pageKey];

  useMeta(
    `${pageKey === 'about'
      ? 'About'
      : pageKey === 'privacy'
        ? 'Privacy Policy'
        : pageKey === 'terms'
          ? 'Terms and Conditions'
          : 'Contact'} | TechAbhi`
  );

  return (
    <main className="min-h-screen bg-[#f7f8fc] pb-14">
      <PageHero page={page} />
      <div className="mx-auto -mt-5 max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
        {children}
      </div>
    </main>
  );
}

export const About = () => (
  <PageLayout pageKey="about">
    <div className="grid gap-5 md:grid-cols-2">
      <ContentCard icon={BriefcaseBusiness} title="Discover opportunities">
        <p>
          TechAbhi is a job discovery portal designed to make exploring
          opportunities more convenient.
        </p>
        <p>
          We publish job openings and help users find the employer’s official
          application page.
        </p>
      </ContentCard>

      <ContentCard icon={UserCheck} title="Your career, your decision">
        <p>
          Use the information available in job listings to explore roles that
          fit your interests and experience.
        </p>
        <p>
          TechAbhi does not submit applications on your behalf and cannot
          guarantee interviews, selection, or employment.
        </p>
      </ContentCard>
    </div>

    <ContentCard icon={HeartHandshake} title="Our approach">
      <p>
        Our aim is to make job discovery easier and help candidates navigate
        opportunities with greater clarity.
      </p>
      <p>
        Always verify the details of a vacancy and the employer before sharing
        personal information or applying.
      </p>
    </ContentCard>

    <BottomCTA />
  </PageLayout>
);

export const Contact = () => (
  <PageLayout pageKey="contact">
    <div className="grid items-start gap-5 md:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <ContentCard icon={MessageCircle} title="How can we help?">
          <p>
            Contact us if you have questions about the website, want to report
            incorrect job information, or need to request removal of a listing.
          </p>
          <p>
            When reporting a listing, include its title and page link so the
            issue can be identified more easily.
          </p>
        </ContentCard>

        <ContentCard icon={MapPin} title="Job listing corrections">
          <p>
            If a job link is broken, a vacancy appears outdated, or details seem
            incorrect, share the relevant listing information in your message.
          </p>
        </ContentCard>
      </div>

      <ContactCard />
    </div>
  </PageLayout>
);

export const Privacy = () => (
  <PageLayout pageKey="privacy">
    <ContentCard icon={Globe2} title="1. Browsing the website">
      <p>
        You can browse job listings without creating an account.
      </p>
      <p>
        The website may process technical information required to operate the
        service. The exact information collected depends on the features and
        services enabled on your deployment.
      </p>
    </ContentCard>

    <ContentCard icon={BriefcaseBusiness} title="2. Usage analytics">
      <p>
        TechAbhi records counts of job views, application-link clicks, and share
        clicks to understand which opportunities are useful to visitors.
      </p>
      <p>
        These events help us understand website usage. Review your actual
        backend implementation before making more specific claims about what
        data is collected or retained.
      </p>
    </ContentCard>

    <ContentCard icon={ShieldCheck} title="3. Account security">
      <p>
        Administrative accounts use hashed passwords rather than storing
        passwords as plain text.
      </p>
      <p>
        Keep your account credentials private and use a strong, unique password.
      </p>
    </ContentCard>

    <ContentCard icon={FileText} title="4. Policy updates">
      <p>
        This page should accurately describe the data, cookies, analytics,
        retention periods, and third-party services used by the live website.
      </p>
      <p>
        This starter policy is not legal advice. Review and adapt it to your
        actual practices and applicable legal requirements before launch.
      </p>
    </ContentCard>
  </PageLayout>
);

export const Terms = () => (
  <PageLayout pageKey="terms">
    <ContentCard icon={BriefcaseBusiness} title="1. Job listing information">
      <p>
        Job listings are provided for informational and discovery purposes.
        Availability, eligibility, compensation, and other details may change.
      </p>
      <p>
        Verify important details on the employer’s official website before
        applying.
      </p>
    </ContentCard>

    <ContentCard icon={ShieldCheck} title="2. Stay safe while applying">
      <p>
        Never pay money simply to secure a job or interview. Be cautious of
        requests for sensitive information, suspicious links, or unverified
        recruiters.
      </p>
      <p>
        TechAbhi is not the employer and does not make hiring decisions.
      </p>
    </ContentCard>

    <ContentCard icon={UserCheck} title="3. Your responsibility">
      <p>
        Use the website lawfully and provide accurate information wherever
        required. Evaluate opportunities independently before sharing personal
        information with a third party.
      </p>
    </ContentCard>

    <ContentCard icon={FileText} title="4. Service limitations and updates">
      <p>
        We aim to make job discovery convenient, but cannot guarantee that every
        listing is current, complete, or suitable for every visitor.
      </p>
      <p>
        These terms are a starting template. Review and adapt them to your
        actual service and applicable legal requirements before launch.
      </p>
    </ContentCard>

    <BottomCTA />
  </PageLayout>
);
