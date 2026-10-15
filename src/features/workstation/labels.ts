import type { Locale } from "@/i18n/config";

const pt = {
  title: "Obsidian Workstation", caption: "Um objeto. Muitas possibilidades.",
  explore: "Explorar notebook", enable: "Ativar notebook 3D", focus: "Focar tela", exitFocus: "Voltar ao notebook",
  close: "Voltar ao desktop", openLid: "Abrir tampa", closeLid: "Fechar tampa", lid: "Abertura da tampa",
  left: "Girar à esquerda", right: "Girar à direita", tilt: "Inclinar notebook", reset: "Redefinir posição",
  desktop: "Desktop", browser: "Browser", code: "Código", fixture: "Laboratório interativo",
  fixtureNote: "Página de teste local. Use o mouse ou teclado para clicar e rolar dentro da tela.",
  greeting: "Explore por dentro.", subtitle: "Abra uma janela. Gire o objeto. Encontre outra perspectiva.",
  codeNote: "O explorador de código do próprio portfólio será conectado na fase P03. Nenhum código de clientes é exibido aqui.",
  unavailable: "Incorporação ainda não autorizada para publicação. A verificação local está registrada no relatório da POC.",
  external: "Abrir site real em nova aba", localProof: "Prévia experimental · verificação local",
  hint: "Arraste a base para girar. Use a tela para navegar.", keyboardNote: "Teclado e trackpad físicos do modelo serão conectados ao sistema na fase P05.",
  fallback: "A tela 2D continua disponível sem WebGL. Ative o 3D quando desejar.",
  project: "Explorar no notebook", fixtureTitle: "Um espaço para experimentar", fixtureInput: "Escreva uma ideia",
  fixtureAction: "Testar interação", fixtureResult: "Interação confirmada", fixtureScroll: "Continue rolando dentro desta janela",
  fixtureEnd: "Você chegou ao final da página de teste.", fixtureLink: "Ir ao final", fixtureBack: "Voltar ao início",
  lab: "POC P01 · Notebook + tela real", returnPortfolio: "Voltar ao portfólio", loading: "Carregando página…",
};
type Labels = { [K in keyof typeof pt]: string };
const en: Labels = {
  title: "Obsidian Workstation", caption: "One object. Many possibilities.",
  explore: "Explore notebook", enable: "Enable 3D notebook", focus: "Focus screen", exitFocus: "Back to notebook",
  close: "Back to desktop", openLid: "Open lid", closeLid: "Close lid", lid: "Lid opening",
  left: "Rotate left", right: "Rotate right", tilt: "Tilt notebook", reset: "Reset position",
  desktop: "Desktop", browser: "Browser", code: "Code", fixture: "Interactive laboratory",
  fixtureNote: "Local test page. Use your mouse or keyboard to click and scroll inside the screen.",
  greeting: "Explore from within.", subtitle: "Open a window. Turn the object. Find another perspective.",
  codeNote: "The source explorer for this portfolio will be connected in phase P03. No client source code is displayed here.",
  unavailable: "Embedding is not yet authorized for publication. Local verification is recorded in the POC report.",
  external: "Open real website in a new tab", localProof: "Experimental preview · local verification",
  hint: "Drag the base to rotate. Use the screen to navigate.", keyboardNote: "The model’s keyboard and trackpad will connect to the system in phase P05.",
  fallback: "The 2D screen remains available without WebGL. Enable 3D whenever you like.",
  project: "Explore in notebook", fixtureTitle: "A space to experiment", fixtureInput: "Write an idea",
  fixtureAction: "Test interaction", fixtureResult: "Interaction confirmed", fixtureScroll: "Keep scrolling inside this window",
  fixtureEnd: "You reached the end of the test page.", fixtureLink: "Go to the end", fixtureBack: "Back to the start",
  lab: "P01 POC · Notebook + real screen", returnPortfolio: "Back to portfolio", loading: "Loading page…",
};
const es: Labels = {
  title: "Obsidian Workstation", caption: "Un objeto. Muchas posibilidades.",
  explore: "Explorar notebook", enable: "Activar notebook 3D", focus: "Enfocar pantalla", exitFocus: "Volver al notebook",
  close: "Volver al escritorio", openLid: "Abrir tapa", closeLid: "Cerrar tapa", lid: "Apertura de la tapa",
  left: "Girar a la izquierda", right: "Girar a la derecha", tilt: "Inclinar notebook", reset: "Restablecer posición",
  desktop: "Escritorio", browser: "Browser", code: "Código", fixture: "Laboratorio interactivo",
  fixtureNote: "Página local de prueba. Usa el ratón o teclado para hacer clic y desplazarte dentro de la pantalla.",
  greeting: "Explora por dentro.", subtitle: "Abre una ventana. Gira el objeto. Encuentra otra perspectiva.",
  codeNote: "El explorador del código de este portafolio se conectará en la fase P03. No se muestra código de clientes aquí.",
  unavailable: "La incorporación aún no está autorizada para publicación. La verificación local está registrada en el informe de la POC.",
  external: "Abrir sitio real en otra pestaña", localProof: "Vista experimental · verificación local",
  hint: "Arrastra la base para girar. Usa la pantalla para navegar.", keyboardNote: "El teclado y trackpad del modelo se conectarán al sistema en la fase P05.",
  fallback: "La pantalla 2D sigue disponible sin WebGL. Activa el 3D cuando quieras.",
  project: "Explorar en el notebook", fixtureTitle: "Un espacio para experimentar", fixtureInput: "Escribe una idea",
  fixtureAction: "Probar interacción", fixtureResult: "Interacción confirmada", fixtureScroll: "Sigue desplazándote dentro de esta ventana",
  fixtureEnd: "Llegaste al final de la página de prueba.", fixtureLink: "Ir al final", fixtureBack: "Volver al inicio",
  lab: "POC P01 · Notebook + pantalla real", returnPortfolio: "Volver al portafolio", loading: "Cargando página…",
};
export const workstationLabels: Record<Locale, Labels> = { pt, en, es };
export type WorkstationLabels = Labels;
