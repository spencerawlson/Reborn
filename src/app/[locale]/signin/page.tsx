import { notFound, redirect } from "next/navigation";
import { SignInForm } from "@/components/AuthForms";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getSession } from "@/lib/auth/session";
import { isLocale, t } from "@/lib/i18n/index";

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const { next } = await searchParams;
  const target = next && next.startsWith("/") && !next.startsWith("//") ? next : `/${locale}/account`;
  if (await getSession()) redirect(target);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="bg-slate-50">
        <div className="mx-auto max-w-md px-5 py-14 sm:py-20">
          <h1 className="text-3xl font-semibold tracking-[-0.02em] text-navy-900 sm:text-4xl">{t(locale, "signinTitle")}</h1>
          <div className="mt-8 rounded-3xl bg-white p-6 shadow-[0_10px_28px_rgba(17,24,39,0.07)] ring-1 ring-slate-200 sm:p-8">
            <SignInForm locale={locale} next={target} />
          </div>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
