/**
 * Israeli Academic Institutions
 *
 * List of universities and colleges with Moodle support.
 * Used in onboarding to set user's institution.
 */

export interface Institution {
  id: string;
  name: string;
  nameEn: string;
  type: "university" | "college";
  moodleUrl?: string;
  /** Whether the institution is supported (has been tested) */
  supported: boolean;
}

export const INSTITUTIONS: Institution[] = [
  // Universities
  {
    id: "tau",
    name: "אוניברסיטת תל אביב",
    nameEn: "Tel Aviv University",
    type: "university",
    moodleUrl: "https://moodle.tau.ac.il",
    supported: false,
  },
  {
    id: "huji",
    name: "האוניברסיטה העברית",
    nameEn: "Hebrew University",
    type: "university",
    moodleUrl: "https://moodle.huji.ac.il",
    supported: false,
  },
  {
    id: "technion",
    name: "הטכניון",
    nameEn: "Technion",
    type: "university",
    moodleUrl: "https://moodle.technion.ac.il",
    supported: false,
  },
  {
    id: "bgu",
    name: "אוניברסיטת בן גוריון",
    nameEn: "Ben-Gurion University",
    type: "university",
    moodleUrl: "https://moodle.bgu.ac.il",
    supported: false,
  },
  {
    id: "biu",
    name: "אוניברסיטת בר אילן",
    nameEn: "Bar-Ilan University",
    type: "university",
    moodleUrl: "https://moodle.biu.ac.il",
    supported: false,
  },
  {
    id: "haifa",
    name: "אוניברסיטת חיפה",
    nameEn: "University of Haifa",
    type: "university",
    moodleUrl: "https://moodle.haifa.ac.il",
    supported: false,
  },
  {
    id: "openu",
    name: "האוניברסיטה הפתוחה",
    nameEn: "Open University",
    type: "university",
    moodleUrl: "https://opal.openu.ac.il",
    supported: false,
  },
  {
    id: "ariel",
    name: "אוניברסיטת אריאל",
    nameEn: "Ariel University",
    type: "university",
    moodleUrl: "https://moodle.ariel.ac.il",
    supported: false,
  },
  {
    id: "weizmann",
    name: "מכון ויצמן",
    nameEn: "Weizmann Institute",
    type: "university",
    supported: false,
  },

  // Colleges
  {
    id: "jct",
    name: "מכון לב (JCT)",
    nameEn: "Jerusalem College of Technology",
    type: "college",
    moodleUrl: "https://moodle.jct.ac.il",
    supported: true,
  },
  {
    id: "hit",
    name: "HIT - המכון הטכנולוגי חולון",
    nameEn: "Holon Institute of Technology",
    type: "college",
    moodleUrl: "https://moodle.hit.ac.il",
    supported: false,
  },
  {
    id: "afeka",
    name: "אפקה - המכללה האקדמית להנדסה",
    nameEn: "Afeka College",
    type: "college",
    moodleUrl: "https://moodle.afeka.ac.il",
    supported: false,
  },
  {
    id: "sce",
    name: "SCE - סמי שמעון",
    nameEn: "SCE - Shamoon College",
    type: "college",
    moodleUrl: "https://moodle.sce.ac.il",
    supported: false,
  },
  {
    id: "braude",
    name: "מכללת בראודה",
    nameEn: "ORT Braude College",
    type: "college",
    moodleUrl: "https://moodle.braude.ac.il",
    supported: false,
  },
  {
    id: "ruppin",
    name: "המכללה האקדמית רופין",
    nameEn: "Ruppin Academic Center",
    type: "college",
    moodleUrl: "https://moodle.ruppin.ac.il",
    supported: false,
  },
  {
    id: "mta",
    name: "המכללה האקדמית תל אביב-יפו",
    nameEn: "Tel Aviv-Yafo Academic College",
    type: "college",
    moodleUrl: "https://moodle.mta.ac.il",
    supported: false,
  },
  {
    id: "hac",
    name: "המכללה האקדמית הדסה",
    nameEn: "Hadassah Academic College",
    type: "college",
    moodleUrl: "https://moodle.hac.ac.il",
    supported: false,
  },
  {
    id: "colman",
    name: "המכללה למנהל",
    nameEn: "College of Management",
    type: "college",
    supported: false,
  },
  {
    id: "idc",
    name: "הבינתחומי הרצליה (רייכמן)",
    nameEn: "Reichman University",
    type: "university",
    supported: false,
  },
  {
    id: "other",
    name: "מוסד אחר",
    nameEn: "Other",
    type: "college",
    supported: false,
  },
];

/**
 * Get supported institutions (for showing "supported" badge)
 */
export function getSupportedInstitutions(): Institution[] {
  return INSTITUTIONS.filter((i) => i.supported);
}

/**
 * Get institution by ID
 */
export function getInstitutionById(id: string): Institution | undefined {
  return INSTITUTIONS.find((i) => i.id === id);
}

/**
 * Group institutions by type
 */
export function getInstitutionsByType(): {
  universities: Institution[];
  colleges: Institution[];
} {
  return {
    universities: INSTITUTIONS.filter((i) => i.type === "university"),
    colleges: INSTITUTIONS.filter((i) => i.type === "college"),
  };
}

/**
 * Get Moodle URL by institution ID
 */
export function getMoodleUrlByInstitutionId(id: string): string | null {
  const institution = getInstitutionById(id);
  return institution?.moodleUrl ?? null;
}
