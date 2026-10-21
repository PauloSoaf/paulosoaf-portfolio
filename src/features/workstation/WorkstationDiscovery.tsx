import type { Locale } from "@/i18n/config";
const discoveryLabels = {
  pt: { discoverTitle: "Como explorar o notebook", discoverClose: "Fechar dicas", discoverMove: "Arraste a base. Faça um círculo e solte para dar giro. No celular, segure a base antes de mover.", discoverInput: "Clique na tampa, digite nas teclas e deslize no trackpad. Nos sites, use os controles nativos da tela.", discoverProjects: "Abra projetos ou Código. Mais opções: clique direito, toque longo ou Shift+F10 no notebook.", quickAccess: "Acesso rápido ao portfólio", quickAbout: "Perfil", quickWork: "Projetos", quickContact: "Contato", quickCv: "Currículo", cvPending: "Currículo em revisão" },
  en: { discoverTitle: "Explore the notebook", discoverClose: "Close tips", discoverMove: "Drag the base. Circle and release to give it spin. On a phone, hold the base before moving.", discoverInput: "Click the lid, type on the keys and slide on the trackpad. In websites, use the screen’s native controls.", discoverProjects: "Open projects or Code. More options: right click, long press or Shift+F10 on the notebook.", quickAccess: "Quick portfolio access", quickAbout: "Profile", quickWork: "Projects", quickContact: "Contact", quickCv: "Résumé", cvPending: "Résumé under review" },
  es: { discoverTitle: "Cómo explorar el notebook", discoverClose: "Cerrar consejos", discoverMove: "Arrastra la base. Haz un círculo y suelta para darle giro. En el móvil, mantén la base pulsada antes de mover.", discoverInput: "Pulsa la tapa, escribe con las teclas y desliza por el trackpad. En los sitios, usa los controles nativos de la pantalla.", discoverProjects: "Abre proyectos o Código. Más opciones: clic derecho, pulsación larga o Shift+F10 en el notebook.", quickAccess: "Acceso rápido al portafolio", quickAbout: "Perfil", quickWork: "Proyectos", quickContact: "Contacto", quickCv: "Currículum", cvPending: "Currículum en revisión" },
};

/** Native non-modal popover: optional and usable before JS/WebGL; escapes the hero's clipping. */
export function WorkstationDiscovery({ locale, cvHref }: { locale: Locale; cvHref?: string }) {
  const text = discoveryLabels[locale];
  return <div className="workstation-discovery" data-workstation-discovery>
    <button type="button" popoverTarget="workstation-discovery-card">{text.discoverTitle}<span aria-hidden="true">＋</span></button>
    <div id="workstation-discovery-card" popover="auto" className="workstation-discovery-card" role="region" aria-label={text.discoverTitle}>
      <div className="workstation-discovery-heading"><strong>{text.discoverTitle}</strong><button type="button" popoverTarget="workstation-discovery-card" popoverTargetAction="hide" aria-label={text.discoverClose}>×</button></div>
      <ol><li>{text.discoverMove}</li><li>{text.discoverInput}</li><li>{text.discoverProjects}</li></ol>
      <nav aria-label={text.quickAccess}>
        <a href="#about">{text.quickAbout}</a><a href="#work">{text.quickWork}</a><a href="#contact">{text.quickContact}</a>
        {cvHref ? <a href={cvHref} target="_blank" rel="noopener noreferrer">{text.quickCv} ↗</a> : <span>{text.cvPending}</span>}
      </nav>
    </div>
  </div>;
}
