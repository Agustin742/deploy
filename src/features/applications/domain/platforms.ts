import { slug } from "@/shared/lib/text";
import type { Platform } from "@/features/state/domain/types";

const PLATFORM_DATA: ReadonlyArray<readonly [string, string]> = [
  ["LinkedIn", "https://www.linkedin.com/jobs/"],
  ["Indeed", "https://ar.indeed.com/"],
  ["Tecla", "https://tecla.io/"],
  ["Kala Talent", "https://www.kalatalent.com/"],
  ["Real Work From Anywhere", "https://www.realworkfromanywhere.com/"],
  ["Interfell", "https://interfell.com/"],
  ["Get on Board", "https://www.getonbrd.com/"],
  ["Remotive", "https://remotive.com/"],
  ["Wellfound", "https://wellfound.com/jobs"],
  ["Working Nomads", "https://www.workingnomads.com/jobs"],
  ["Himalayas", "https://himalayas.app/jobs"],
  ["ZipRecruiter", "https://www.ziprecruiter.com/"],
  ["Remote Rocketship", "https://www.remoterocketship.com/"],
  ["Power to Fly", "https://powertofly.com/jobs"],
  ["Torre.ai", "https://torre.ai/"],
  ["NoDesk", "https://nodesk.co/remote-jobs/"],
  ["Jobspresso", "https://jobspresso.co/"],
  ["Jobgether", "https://jobgether.com/"],
  ["RemoteOK", "https://remoteok.com/"],
];

export const PLATS: Platform[] = PLATFORM_DATA.map(([name, url]) => ({ id: slug(name), name, url }));
