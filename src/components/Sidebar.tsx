import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession, signOut } from 'next-auth/react';
import Image from 'next/image';
import { useMailAccount } from '@/hooks/useMailAccount';
import { useMailUnread } from '@/hooks/useMailUnread';
import { LayoutDashboard, Inbox, CalendarDays, Users, FileText, ReceiptEuro, FilePen, Package, PanelLeft, Percent, Receipt, Landmark, ChartColumn, FolderKanban } from 'lucide-react';

// Of de zijbalk ingeklapt staat, onthouden voor de volgende keer
const COLLAPSED_KEY = 'synbased:sidebar-collapsed';

// Elke pagina bouwt de zijbalk opnieuw op. Zonder dit geheugen zou hij bij
// elke klik eerst even uitgeklapt staan voordat de opgeslagen stand er is
let rememberedCollapsed: boolean | null = null;

export default function Sidebar() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  // De Inbox staat er alleen als de module aan staat: als er een mailbox gekoppeld is
  const mailAccount = useMailAccount();
  const unreadMail = useMailUnread(!!mailAccount);
  const dropdownRef = useRef<HTMLDivElement>(null);
  // Ingeklapt blijven alleen de iconen over; een klik op het logo klapt hem weer uit
  const [collapsed, setCollapsed] = useState(rememberedCollapsed ?? false);
  // Op een telefoon is de zijbalk een balk bovenin; de menuknop klapt het menu
  // over het hele scherm open, net als op de website
  const [menuOpen, setMenuOpen] = useState(false);

  // Naar een andere pagina: het menu dicht
  useEffect(() => setMenuOpen(false), [router.asPath]);

  // Wordt het scherm breed genoeg voor de gewone zijbalk, dan gaat het menu dicht
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 769px)');
    const onChange = () => wide.matches && setMenuOpen(false);
    wide.addEventListener('change', onChange);
    return () => wide.removeEventListener('change', onChange);
  }, []);

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

  useEffect(() => {
    if (rememberedCollapsed !== null) return;
    try {
      rememberedCollapsed = localStorage.getItem(COLLAPSED_KEY) === '1';
      setCollapsed(rememberedCollapsed);
    } catch {
      // Zonder opslag begint de zijbalk gewoon uitgeklapt
    }
  }, []);

  const toggleCollapsed = (next: boolean) => {
    rememberedCollapsed = next;
    setCollapsed(next);
    setIsDropdownOpen(false);
    try {
      localStorage.setItem(COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      // Dan geldt het alleen voor nu
    }
  };

  const isActive = (path: string) => {
    return router.pathname === path;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const userName = (session?.user as any)?.name || 'User';
  const userEmail = (session?.user as any)?.email || '';

  return (
    <div className={`sidebar${collapsed ? ' collapsed' : ''}${menuOpen ? ' open' : ''}`}>
      <div className="logo">
        {collapsed ? (
          // Ingeklapt is het logo de knop om uit te klappen; bij hover zie je dat
          <button type="button" className="expand" aria-label="Zijbalk uitklappen" onClick={() => toggleCollapsed(false)}>
            <Image src="/logo.svg" alt="Synbased Logo" width={30} height={30} className="sidebar-logo" />
            <PanelLeft size={18} className="expand-icon" />
          </button>
        ) : (
          <>
            <Image src="/logo.svg" alt="Synbased Logo" width={30} height={30} className="sidebar-logo" />
            <button type="button" className="collapse" aria-label="Zijbalk inklappen" onClick={() => toggleCollapsed(true)}>
              <PanelLeft size={18} />
            </button>
          </>
        )}
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
      <nav className="navigation">
        <Link href="/app/dashboard" className={isActive('/app/dashboard') ? 'active' : ''} data-label="Dashboard">
          <LayoutDashboard size={18} />
          <span className="label">Dashboard</span>
        </Link>
        {mailAccount && (
          <Link href="/app/inbox" className={isActive('/app/inbox') ? 'active' : ''} data-label="Inbox">
            <Inbox size={18} />
            <span className="label">Inbox</span>
            {!!unreadMail && <span className="count">{unreadMail > 999 ? '999+' : unreadMail}</span>}
          </Link>
        )}
        {mailAccount && (
          <Link href="/app/calendar" className={isActive('/app/calendar') ? 'active' : ''} data-label="Agenda">
            <CalendarDays size={18} />
            <span className="label">Agenda</span>
          </Link>
        )}
        <Link href="/app/customers" className={isActive('/app/customers') || router.pathname.startsWith('/app/customers') ? 'active' : ''} data-label="Klanten">
          <Users size={18} />
          <span className="label">Klanten</span>
        </Link>
        <Link href="/app/projects" className={isActive('/app/projects') || router.pathname.startsWith('/app/projects') ? 'active' : ''} data-label="Projecten">
          <FolderKanban size={18} />
          <span className="label">Projecten</span>
        </Link>
        <Link href="/app/quotes" className={isActive('/app/quotes') || router.pathname.startsWith('/app/quotes') ? 'active' : ''} data-label="Offertes">
          <FileText size={18} />
          <span className="label">Offertes</span>
        </Link>
        <Link href="/app/invoices" className={isActive('/app/invoices') || router.pathname.startsWith('/app/invoices') ? 'active' : ''} data-label="Facturen">
          <ReceiptEuro size={18} />
          <span className="label">Facturen</span>
        </Link>
        <Link href="/app/expenses" className={isActive('/app/expenses') || router.pathname.startsWith('/app/expenses') ? 'active' : ''} data-label="Kosten">
          <Receipt size={18} />
          <span className="label">Kosten</span>
        </Link>
        <Link href="/app/bank" className={isActive('/app/bank') ? 'active' : ''} data-label="Bank">
          <Landmark size={18} />
          <span className="label">Bank</span>
        </Link>
        <Link href="/app/vat" className={isActive('/app/vat') ? 'active' : ''} data-label="Btw-overzicht">
          <Percent size={18} />
          <span className="label">Btw-overzicht</span>
        </Link>
        <Link href="/app/reports" className={isActive('/app/reports') ? 'active' : ''} data-label="Jaarcijfers">
          <ChartColumn size={18} />
          <span className="label">Jaarcijfers</span>
        </Link>
        <Link href="/app/products" className={isActive('/app/products') || router.pathname.startsWith('/app/products') ? 'active' : ''} data-label="Producten">
          <Package size={18} />
          <span className="label">Producten</span>
        </Link>
        <Link href="/app/notes" className={isActive('/app/notes') || router.pathname.startsWith('/app/notes') ? 'active' : ''} data-label="Notities">
          <FilePen size={18} />
          <span className="label">Notities</span>
        </Link>
      </nav>

      <div className="profile" ref={dropdownRef} onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
        <div className="avatar">
          {getInitials(userName)}
        </div>
        <div className="info">
          <div className="name">{userName}</div>
          <div className="email">{userEmail}</div>
        </div>


        {isDropdownOpen && (
          <div className="profile-dropdown">


            <div className="menu">
              <Link href="/app/settings" className="item">
                Account instellingen
              </Link>

              <Link href="/" className="item">
                Terug naar website
              </Link>
            </div>

            <div className="logout">
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  Uitloggen
                </button>

            </div>


          </div>
        )}
      </div>
    </div>
  );
}
