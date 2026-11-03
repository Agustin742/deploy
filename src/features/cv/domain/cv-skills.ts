import { hasSkill } from "@/features/matching/domain/engine";
import { SKILLS, type Skill } from "@/features/matching/domain/skills";
import type { Profile } from "@/features/state/domain/types";
import { norm } from "@/shared/lib/text";

export interface RecognizedSkills {
  /** Skills of the built-in catalogue found in the CV, headline or extra skills. */
  found: Skill[];
  /** Extra skills as the person typed them. */
  extra: string[];
}

export function recognizedSkills(profile: Pick<Profile, "cv" | "headline" | "extraSkills">): RecognizedSkills {
  const text = norm(`${profile.cv} ${profile.headline} ${profile.extraSkills}`);
  const extra = (profile.extraSkills || "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return { found: SKILLS.filter((s) => hasSkill(text, s)), extra };
}
