import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'en' | 'fr' | 'es';

interface Translations {
  [key: string]: {
    en: string;
    fr: string;
    es: string;
  };
}

export const DICTIONARY: Translations = {
  // Navigation & Branding
  brand_name: { en: '0machine', fr: '0machine', es: '0machine' },
  tagline: {
    en: 'Run Your Entire Laser Workshop From One Dashboard.',
    fr: 'Gérez Tout Votre Atelier Laser Depuis Un Seul Tableau De Bord.',
    es: 'Dirige Todo Tu Taller Láser Desde Un Solo Panel.',
  },
  sub_tagline: {
    en: 'Estimate jobs in seconds, calculate real profit, manage inventory, optimize material usage, access premium laser-ready designs, and grow your workshop with confidence.',
    fr: 'Estimez vos travaux en secondes, calculez votre vrai profit, gérez votre stock, optimisez l\'utilisation du matériau et accédez à des fichiers laser premium.',
    es: 'Calcula trabajos en segundos, determina beneficios reales, gestiona inventario, optimiza material y accede a diseños láser premium.',
  },
  nav_dashboard: { en: 'Dashboard', fr: 'Tableau de bord', es: 'Panel Principal' },
  nav_calculator: { en: 'Cost Calculator', fr: 'Calculateur de Coût', es: 'Calculadora de Costes' },
  nav_quotes: { en: 'Quotes', fr: 'Devis', es: 'Presupuestos' },
  nav_invoices: { en: 'Invoices', fr: 'Factures', es: 'Facturas' },
  nav_nesting: { en: 'Nesting Yield', fr: 'Imbrication / Nesting', es: 'Optimización Nesting' },
  nav_materials: { en: 'Material Stock', fr: 'Stock Matériaux', es: 'Stock de Materiales' },
  nav_orders: { en: 'Orders Tracker', fr: 'Suivi des Commandes', es: 'Seguimiento Pedidos' },
  nav_presets: { en: 'Laser Presets', fr: 'Préréglages Laser', es: 'Ajustes Láser' },
  nav_designs: { en: 'Design Vault', fr: 'Bibliothèque Vectorielle', es: 'Biblioteca de Diseños' },
  nav_clients: { en: 'Clients CRM', fr: 'Clients CRM', es: 'Clientes CRM' },
  nav_settings: { en: 'Settings', fr: 'Paramètres', es: 'Ajustes' },

  // Plans & Pricing
  plan_free: { en: 'Free Forever', fr: 'Gratuit Pour Toujours', es: 'Gratis Para Siempre' },
  plan_starter: { en: 'Starter', fr: 'Starter', es: 'Starter' },
  plan_pro: { en: 'Workshop Pro', fr: 'Workshop Pro', es: 'Workshop Pro' },
  price_free: { en: '$0', fr: '0 €', es: '0 $' },
  price_starter_mo: { en: '$9/mo', fr: '9 €/mois', es: '9 $/mes' },
  price_starter_yr: { en: '$59/yr', fr: '59 €/an', es: '59 $/año' },
  price_pro_mo: { en: '$19/mo', fr: '19 €/mois', es: '19 $/mes' },
  price_pro_yr: { en: '$149/yr', fr: '149 €/an', es: '149 $/año' },

  billing_monthly: { en: 'Monthly', fr: 'Mensuel', es: 'Mensual' },
  billing_annual: { en: 'Annual (Save 45%)', fr: 'Annuel (-45% de réduction)', es: 'Anual (Ahorra 45%)' },
  most_popular: { en: '⭐ Most Popular', fr: '⭐ Le Plus Populaire', es: '⭐ Más Popular' },
  best_value: { en: '🔥 Best Value', fr: '🔥 Meilleure Valeur', es: '🔥 Mejor Valor' },
  cta_start_free: { en: 'Start Free', fr: 'Commencer Gratuitement', es: 'Empezar Gratis' },
  cta_upgrade_starter: { en: 'Upgrade to Starter', fr: 'Passer à Starter', es: 'Cambiar a Starter' },
  cta_upgrade_pro: { en: 'Upgrade to Pro', fr: 'Passer à Pro', es: 'Cambiar a Pro' },

  // Feature Descriptions & Gating
  feature_projects_limit: { en: '3 Projects per Month', fr: '3 Projets par mois', es: '3 Proyectos por mes' },
  feature_machine_limit: { en: '1 Machine Profile', fr: '1 Profil de machine', es: '1 Perfil de máquina' },
  feature_unlimited_projects: { en: 'Unlimited Projects & Machines', fr: 'Projets et Machines Illimités', es: 'Proyectos y Máquinas Ilimitados' },
  feature_nesting_unlimited: { en: 'Unlimited Nesting Optimization', fr: 'Optimisation Nesting Illimitée', es: 'Nesting e Imbricación Ilimitada' },
  feature_whatsapp_sharing: { en: '1-Click WhatsApp Direct Dispatch', fr: 'Envoi Direct WhatsApp en 1 clic', es: 'Envío Directo por WhatsApp' },
  feature_csv_export: { en: 'CSV & Excel Data Export', fr: 'Exportation CSV & Excel', es: 'Exportación CSV y Excel' },
  feature_team_workspace: { en: 'Team Workspace (3 Users)', fr: 'Espace Équipe (3 Utilisateurs)', es: 'Espacio de Trabajo (3 Usuarios)' },

  // Dashboard Metrics & Sections
  stat_projects: { en: 'Total Projects', fr: 'Projets Totaux', es: 'Proyectos Totales' },
  stat_materials: { en: 'Materials Logged', fr: 'Matériaux Enregistrés', es: 'Materiales Registrados' },
  stat_clients: { en: 'Active Clients', fr: 'Clients Actifs', es: 'Clientes Activos' },
  stat_invoices: { en: 'Invoices Issued', fr: 'Factures Émises', es: 'Facturas Emitidas' },
  stat_revenue: { en: 'Total Revenue', fr: 'Chiffre d\'affaires', es: 'Ingresos Totales' },
  dash_quick_start: { en: 'Quick Start Toolkit', fr: 'Outils de Démarrage Rapide', es: 'Herramientas Rápidas' },
  dash_recent_projects: { en: 'Recent Projects', fr: 'Projets Récents', es: 'Proyectos Recientes' },
  dash_view_all: { en: 'View All', fr: 'Voir Tout', es: 'Ver Todo' },

  // Cost Calculator
  calc_title: { en: 'Job Cost & Profit Calculator', fr: 'Calculateur de Coût & Profit', es: 'Calculadora de Coste y Beneficio' },
  calc_subtitle: { en: 'Calculate exact laser cut costs, electricity, labor, and selling price', fr: 'Calculez le coût laser exact, l\'électricité, la main d\'œuvre et le prix de vente', es: 'Calcula el coste láser exacto, electricidad, mano de obra y precio' },
  calc_material: { en: 'Material Type', fr: 'Type de Matériau', es: 'Tipo de Material' },
  calc_sheet_cost: { en: 'Sheet Cost', fr: 'Coût de la Feuille', es: 'Coste de la Plancha' },
  calc_laser_time: { en: 'Laser Cut Time (mins)', fr: 'Temps Laser (mins)', es: 'Tiempo Láser (mins)' },
  calc_electricity: { en: 'Electricity Rate', fr: 'Tarif Électricité', es: 'Tarifa Electricidad' },
  calc_labor: { en: 'Labor Cost per Hour', fr: 'Main d\'œuvre / Heure', es: 'Mano de Obra / Hora' },
  calc_margin: { en: 'Desired Profit Margin (%)', fr: 'Marge Souhaitée (%)', es: 'Margen de Beneficio (%)' },
  calc_rec_price: { en: 'Recommended Selling Price', fr: 'Prix de Vente Recommandé', es: 'Precio de Venta Recomendado' },
  calc_total_cost: { en: 'Total Production Cost', fr: 'Coût Total de Production', es: 'Coste Total de Producción' },

  // Material Inventory
  mat_title: { en: 'Material Stock Inventory', fr: 'Inventaire du Stock Matériaux', es: 'Inventario de Materiales' },
  mat_subtitle: { en: 'Track plywood, acrylic sheets, and low stock warnings', fr: 'Gérez vos feuilles de contreplaqué, acrylique et alertes de stock', es: 'Gestiona pliegos de madera, metacrilato y alertas' },
  mat_add: { en: 'Add Material Sheet', fr: 'Ajouter un Matériau', es: 'Añadir Material' },
  mat_stock: { en: 'In Stock', fr: 'En Stock', es: 'En Stock' },
  mat_low_stock: { en: 'Low Stock Alert', fr: 'Alerte Stock Bas', es: 'Alerta Stock Bajo' },

  // Laser Presets
  preset_title: { en: 'Laser Settings Presets Library', fr: 'Bibliothèque de Réglages Laser', es: 'Ajustes Láser Guardados' },
  preset_subtitle: { en: 'Speed, power, frequency, and passes per material', fr: 'Vitesse, puissance, fréquence et passes par matériau', es: 'Velocidad, potencia, frecuencia y pasadas' },
  preset_speed: { en: 'Speed (mm/s)', fr: 'Vitesse (mm/s)', es: 'Velocidad (mm/s)' },
  preset_power: { en: 'Power (%)', fr: 'Puissance (%)', es: 'Potencia (%)' },
  preset_freq: { en: 'Frequency (Hz)', fr: 'Fréquence (Hz)', es: 'Frecuencia (Hz)' },
  preset_passes: { en: 'Passes', fr: 'Passes', es: 'Pasadas' },

  // Nesting Estimator
  nest_title: { en: 'Sheet Nesting & Yield Estimator', fr: 'Calculateur d\'Imbrication / Nesting', es: 'Calculadora de Nesting' },
  nest_subtitle: { en: 'Optimize layout and minimize scrap on sheet materials', fr: 'Optimisez l\'agencement et réduisez les chutes de matériaux', es: 'Optimiza la disposición y reduce desperdicios' },
  nest_sheet_w: { en: 'Sheet Width (mm)', fr: 'Largeur Feuille (mm)', es: 'Ancho Plancha (mm)' },
  nest_sheet_h: { en: 'Sheet Height (mm)', fr: 'Hauteur Feuille (mm)', es: 'Alto Plancha (mm)' },
  nest_part_w: { en: 'Part Width (mm)', fr: 'Largeur Pièce (mm)', es: 'Ancho Pieza (mm)' },
  nest_part_h: { en: 'Part Height (mm)', fr: 'Hauteur Pièce (mm)', es: 'Alto Pieza (mm)' },
  nest_parts_sheet: { en: 'Parts per Sheet', fr: 'Pièces par Feuille', es: 'Piezas por Plancha' },
  nest_yield: { en: 'Material Usage Yield', fr: 'Rendement d\'Utilisation', es: 'Rendimiento de Uso' },
  nest_waste: { en: 'Scrap Waste', fr: 'Chutes / Déchets', es: 'Desperdicio' },
  nest_net_profit: { en: 'Est. Net Profit', fr: 'Profit Net Estimé', es: 'Beneficio Neto Est.' },

  // Design Library
  design_title: { en: 'Vector Design Vault', fr: 'Bibliothèque de Fichiers Vectoriels', es: 'Biblioteca de Diseños Vectores' },
  design_subtitle: { en: 'Browse 500+ commercial laser-ready DXF & SVG templates', fr: 'Parcourez 500+ fichiers laser prêts à découper', es: 'Explora 500+ plantillas láser listas para cortar' },
  design_search: { en: 'Search vector designs...', fr: 'Rechercher des fichiers vectoriels...', es: 'Buscar diseños vectoriales...' },
  design_downloads: { en: 'Downloads', fr: 'Téléchargements', es: 'Descargas' },

  // General Actions
  btn_cancel: { en: 'Cancel', fr: 'Annuler', es: 'Cancelar' },
  btn_save: { en: 'Save', fr: 'Enregistrer', es: 'Guardar' },
  btn_export: { en: 'Export CSV', fr: 'Exporter CSV', es: 'Exportar CSV' },
  btn_whatsapp: { en: 'Send via WhatsApp', fr: 'Envoyer via WhatsApp', es: 'Enviar por WhatsApp' },
  locked_feature: { en: 'Pro Feature 🔒', fr: 'Fonctionnalité Pro 🔒', es: 'Función Pro 🔒' },
  upgrade_modal_title: { en: 'Unlock Pro Workshop Features', fr: 'Débloquez les fonctionnalités Pro', es: 'Desbloquea las Funciones Pro' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key: string) => key,
});

const STORAGE_KEY = '0machine_app_language';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(savedLang => {
      if (savedLang && (savedLang === 'en' || savedLang === 'fr' || savedLang === 'es')) {
        setLanguageState(savedLang as Language);
      }
    });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEY, lang);
  };

  const t = (key: string): string => {
    const item = DICTIONARY[key];
    if (!item) return key;
    return item[language] || item.en || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
