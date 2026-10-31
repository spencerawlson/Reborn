import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Icon } from "@/components/Icon";
import { HAITI_MAP } from "@/components/map-data";
import { PasswordForm, ProfileForm } from "@/components/ProfileForms";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import { getAccount } from "@/lib/auth/accounts";
import { getSession } from "@/lib/auth/session";
import { getDb } from "@/lib/db/index";
import { isLocale, t } from "@/lib/i18n/index";

const DEPARTMENTS = HAITI_MAP.departments
  .map((d) => ({ iso: d.iso, name: d.name }))
  .sort((a, b) => a.name.localeCompare(b.name, "fr"));

/** The customer edits their own name, phone, Haiti address, and password. */
export default async function EditAccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const session = await getSession();
  if (!session) redirect(`/${locale}/signin?next=/${locale}/account/edit`);
  const account = await getAccount(await getDb(), session);

  return (
    <>
      <SiteHeader locale={locale} />
      <main className="bg-slate-50">
        <div className="mx-auto max-w-2xl px-5 py-12 sm:py-16">
          <Link href={`/${locale}/account`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700">
            <Icon name="arrowRight" size={16} className="rotate-180" /> {t(locale, "orderBack")}
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-[-0.02em] text-navy-900">{t(locale, "accountEdit")}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {account.email} · {t(locale, "accountEditBody")}
          </p>

          <section className="mt-8 rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
            <ProfileForm
              locale={locale}
              departments={DEPARTMENTS}
              values={{
                name: account.displayName,
                phone: account.phone,
                department: account.haiti?.department ?? null,
                city: account.haiti?.city ?? null,
                neighborhood: account.haiti?.neighborhood ?? null,
                directions: account.haiti?.directions ?? null,
                haitiPhone: account.haiti?.phone ?? null,
              }}
            />
          </section>

          <section className="mt-6 rounded-3xl bg-white p-6 ring-1 ring-slate-200 sm:p-8">
            <h2 className="mb-5 text-lg font-semibold text-navy-900">{t(locale, "passwordTitle")}</h2>
            <PasswordForm locale={locale} />
          </section>
        </div>
      </main>
      <SiteFooter locale={locale} />
    </>
  );
}
