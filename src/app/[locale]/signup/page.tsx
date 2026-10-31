import { notFound, redirect } from "next/navigation";
import { SignUpForm } from "@/components/AuthForms";
import { HAITI_MAP } from "@/components/map-data";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getSession } from "@/lib/auth/session";
import { isLocale, t } from "@/lib/i18n/index";

const DEPARTMENTS = HAITI_MAP.departments
  .map((d) => ({ iso: d.iso, name: d.name }))
  .sort((a, b) => a.name.localeCompare(b.name, "fr"));

export default async function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  if (await getSession()) redirect(`/${locale}/account`);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="bg-slate-50">
        <div className="mx-auto max-w-xl px-5 py-14 sm:py-20">
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-4xl">{t(locale, "signupTitle")}</h1>
          <p className="mt-3 text-slate-600">{t(locale, "signupBody")}</p>
          <div className="mt-8 rounded-3xl bg-white p-6 shadow-[0_10px_28px_rgba(17,24,39,0.07)] ring-1 ring-slate-200 sm:p-8">
            <SignUpForm locale={locale} departments={DEPARTMENTS} />
          </div>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
