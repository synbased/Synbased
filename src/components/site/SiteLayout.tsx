import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { pageTitle } from '@/lib/constants';

/** De pagina's in het menu, bovenin en in het mobiele menu */
const NAVIGATION = [
  { href: '/modules', label: 'Modules' },
  { href: '/pricing', label: 'Prijzen' },
  { href: '/faq', label: 'Vragen' },
];

/**
 * De omlijsting van de website op synbased.com: kop met menu, en de voet.
 * Wie al ingelogd is, ziet "Naar dashboard" in plaats van "Inloggen".
 *
 * Op een smal scherm vervangt een menuknop de links, zoals op vercel.com: het
 * menu vult dan het scherm onder de kop, met de knoppen bovenaan.
 */
export default function SiteLayout({
  title,
  description,
  children,
}: {
  /** Leeg voor de homepage: dan staat er alleen "Synbased" in het tabblad */
  title?: string;
  description: string;
  children: ReactNode;
}) {
  const { status } = useSession();
  const loggedIn = status === 'authenticated';
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  // Een link is actief op zijn eigen pagina en alles daaronder, zoals /modules/quotes
  const isActive = (href: string) => router.pathname === href || router.pathname.startsWith(`${href}/`);

  // Naar een andere pagina: het menu dicht
  useEffect(() => setMenuOpen(false), [router.asPath]);

  // Met het menu open scrolt de pagina erachter niet mee, en Escape sluit hem
  useEffect(() => {
    if (!menuOpen) return;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  const actions = loggedIn ? (
    <Link href="/app/dashboard" className="button">
      Naar dashboard
    </Link>
  ) : (
    <>
      <Link href="/login" className="button tertiary">
        Inloggen
      </Link>
      <Link href="/demo" className="button">
        Demo aanvragen
      </Link>
    </>
  );

  return (
    <div className="site">
      <Head>
        <title>{title ? pageTitle(title) : 'Synbased - Offertes en facturen voor vakmensen'}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={title ? pageTitle(title) : 'Synbased'} />
        <meta property="og:description" content={description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="site-header">
        <div className="site-container">
          <Link href="/" className="site-logo" aria-label="Synbased, naar de homepage">
            <Image src="/logo.svg" alt="" width={28} height={28} priority />
            <span>Synbased</span>
          </Link>

          <nav className="site-nav" aria-label="Hoofdmenu">
            {NAVIGATION.map(({ href, label }) => (
              <Link key={href} href={href} className={isActive(href) ? 'active' : ''}>
                {label}
              </Link>
            ))}
          </nav>

          <div className="site-actions">{actions}</div>

          <button
            type="button"
            className={`site-menu-button${menuOpen ? ' open' : ''}`}
            aria-label={menuOpen ? 'Menu sluiten' : 'Menu openen'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
          </button>
        </div>

        {menuOpen && (
          <nav className="site-mobile-menu" aria-label="Menu">
            <div className="site-mobile-actions">{actions}</div>
            {NAVIGATION.map(({ href, label }) => (
              <Link key={href} href={href} className={isActive(href) ? 'active' : ''}>
                {label}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main>{children}</main>

      <footer className="site-footer">
        <div className="site-container">
          <div className="site-footer-brand">
            <Link href="/" className="site-logo">
              <Image src="/logo.svg" alt="" width={24} height={24} />
              <span>Synbased</span>
            </Link>
            <p>Offertes, facturen en mail voor vakmensen. Alles op één plek.</p>
          </div>

          <div className="site-footer-links">
            <div>
              <span className="title">Product</span>
              <Link href="/modules">Modules</Link>
              <Link href="/pricing">Prijzen</Link>
              <Link href="/faq">Vragen</Link>
              <Link href="/demo">Demo aanvragen</Link>
            </div>
            <div>
              <span className="title">Account</span>
              <Link href="/login">Inloggen</Link>
              <Link href="/forgot-password">Wachtwoord vergeten</Link>
            </div>
            <div>
              <span className="title">Juridisch</span>
              <Link href="/privacy">Privacyverklaring</Link>
              <Link href="/terms">Algemene voorwaarden</Link>
            </div>
          </div>
        </div>

        <div className="site-container site-footer-bottom">
          <span>© {new Date().getFullYear()} Synbased</span>
        </div>
      </footer>
    </div>
  );
}
