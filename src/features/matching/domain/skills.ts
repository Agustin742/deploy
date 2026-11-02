import { escapeRegExp, norm } from "@/shared/lib/text";

/** "h" = hard (technical) skill, "s" = soft skill. */
export type SkillKind = "h" | "s";

export interface Skill {
  n: string;
  k: SkillKind;
  res: RegExp[];
}

// [name, kind, aliases]
const SKILL_DATA: ReadonlyArray<readonly [string, SkillKind, readonly string[]]> = [
  ["JavaScript", "h", ["javascript", "js", "ecmascript", "es6"]],
  ["TypeScript", "h", ["typescript", "ts"]],
  ["React", "h", ["react", "reactjs", "react.js"]],
  ["Next.js", "h", ["next.js", "nextjs"]],
  ["Vue", "h", ["vue", "vuejs", "vue.js"]],
  ["Angular", "h", ["angular", "angularjs"]],
  ["Svelte", "h", ["svelte", "sveltekit"]],
  ["HTML", "h", ["html", "html5"]],
  ["CSS", "h", ["css", "css3"]],
  ["Sass", "h", ["sass", "scss"]],
  ["Tailwind", "h", ["tailwind", "tailwindcss"]],
  ["Bootstrap", "h", ["bootstrap"]],
  ["Redux", "h", ["redux", "zustand", "context api"]],
  ["Jest", "h", ["jest", "vitest", "testing library", "unit testing", "tests unitarios"]],
  ["Cypress", "h", ["cypress", "playwright", "e2e"]],
  ["Vite/Webpack", "h", ["vite", "webpack"]],
  ["Storybook", "h", ["storybook"]],
  ["Figma", "h", ["figma"]],
  ["Responsive", "h", ["responsive", "diseno responsivo", "mobile first"]],
  ["Accesibilidad", "h", ["accesibilidad", "accessibility", "a11y", "wcag"]],
  ["UX/UI", "h", ["ux", "ui", "ux/ui", "ui/ux", "experiencia de usuario"]],
  ["REST/APIs", "h", ["rest", "restful", "api rest", "apis", "api"]],
  ["GraphQL", "h", ["graphql"]],
  ["Git", "h", ["git", "github", "gitlab", "bitbucket"]],
  ["CI/CD", "h", ["ci/cd", "cicd", "github actions", "jenkins"]],
  ["Docker", "h", ["docker"]],
  ["Kubernetes", "h", ["kubernetes", "k8s"]],
  ["AWS", "h", ["aws", "amazon web services"]],
  ["Azure", "h", ["azure"]],
  ["GCP", "h", ["gcp", "google cloud"]],
  ["Node.js", "h", ["node", "node.js", "nodejs", "express", "nestjs"]],
  ["Python", "h", ["python", "django", "flask", "fastapi"]],
  ["Java", "h", ["java", "spring", "spring boot"]],
  ["C#/.NET", "h", ["c#", ".net", "dotnet", "asp.net"]],
  ["PHP", "h", ["php", "laravel", "symfony"]],
  ["Ruby", "h", ["ruby", "rails"]],
  ["Go", "h", ["golang"]],
  ["SQL", "h", ["sql", "postgresql", "postgres", "mysql", "sql server"]],
  ["MongoDB", "h", ["mongodb", "mongo", "nosql"]],
  ["Firebase/Supabase", "h", ["firebase", "supabase"]],
  ["Redis", "h", ["redis"]],
  ["Linux", "h", ["linux", "bash"]],
  ["React Native", "h", ["react native", "flutter", "swift", "kotlin", "android", "ios"]],
  ["WordPress", "h", ["wordpress", "woocommerce"]],
  ["Shopify", "h", ["shopify"]],
  ["Scrum/Agile", "h", ["scrum", "agile", "agil", "agiles", "kanban", "metodologias agiles"]],
  ["Jira", "h", ["jira", "trello", "asana"]],
  ["SEO", "h", ["seo", "sem"]],
  ["Google Analytics", "h", ["google analytics", "ga4", "tag manager"]],
  ["Ads", "h", ["google ads", "meta ads", "facebook ads", "paid media"]],
  ["Email marketing", "h", ["email marketing", "mailchimp", "hubspot", "crm", "salesforce"]],
  ["Marketing digital", "h", ["marketing digital", "content marketing", "growth", "redes sociales", "community manager"]],
  ["Excel", "h", ["excel", "google sheets"]],
  ["Power BI/Tableau", "h", ["power bi", "tableau", "looker", "data studio"]],
  ["Análisis de datos", "h", ["analisis de datos", "data analysis", "pandas", "data science"]],
  ["Machine Learning/IA", "h", ["machine learning", "ia", "inteligencia artificial", "llm", "openai", "prompt engineering"]],
  ["Comunicación", "s", ["comunicacion", "comunicacion efectiva", "communication", "comunicativo"]],
  ["Trabajo en equipo", "s", ["trabajo en equipo", "teamwork", "colaboracion", "colaborativo", "collaboration"]],
  ["Liderazgo", "s", ["liderazgo", "leadership", "lider"]],
  ["Resolución de problemas", "s", ["resolucion de problemas", "problem solving", "pensamiento critico"]],
  ["Proactividad", "s", ["proactividad", "proactivo", "proactive", "iniciativa"]],
  ["Autonomía", "s", ["autonomia", "autonomo", "autonomous", "self-starter", "independiente"]],
  ["Adaptabilidad", "s", ["adaptabilidad", "flexibilidad", "adaptable"]],
  ["Gestión del tiempo", "s", ["gestion del tiempo", "time management", "organizacion", "organizado"]],
];

export const SKILLS: Skill[] = SKILL_DATA.map(([n, k, aliases]) => ({
  n,
  k,
  res: aliases.map(
    (a) => new RegExp(`(?<![a-z0-9+#.])${escapeRegExp(norm(a))}(?![a-z0-9+#]|\\.[a-z0-9])`),
  ),
}));

const STOP_WORDS_TEXT =
  "para como pero sobre entre desde hasta donde cuando cada esta este estos estas esto esos esas ese esa tiene tener tienes sera seran debe deben puede pueden mas menos muy tambien ademas otros otras otro otra todo toda todos todas nuestro nuestra nuestros nuestras buscamos busca buscando somos eres trabajo equipo empresa puesto posicion oferta candidato perfil requisitos ofrecemos beneficios personas persona forma parte siendo quien quienes cual cuales porque aunque mientras durante dentro fuera mediante segun sino solo tanto tantos aqui tipo areas area nivel anos con los las del una unos unas por que sus nos hay son ser has haya with that this have will from your their they them been being were what when where which while about also into over such than then these those work team experience ability strong looking role join company position candidate requirements benefits must should would could able years year more most other some each every well both only make sure help across within using used through including etc";

export const STOP_WORDS: ReadonlySet<string> = new Set(STOP_WORDS_TEXT.split(" "));
