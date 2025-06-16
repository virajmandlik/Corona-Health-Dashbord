// Service to map country names to ISO2 codes for react-svg-worldmap
export class CountryMappingService {
  private static instance: CountryMappingService;
  
  // Comprehensive mapping of country names to ISO2 codes
  private readonly countryNameToISO2: Record<string, string> = {
    // Major countries
    "United States": "us",
    "USA": "us",
    "China": "cn",
    "India": "in",
    "Brazil": "br",
    "Russia": "ru",
    "United Kingdom": "gb",
    "UK": "gb",
    "France": "fr",
    "Germany": "de",
    "Italy": "it",
    "Spain": "es",
    "Canada": "ca",
    "Australia": "au",
    "Japan": "jp",
    "South Korea": "kr",
    "Mexico": "mx",
    "Indonesia": "id",
    "Turkey": "tr",
    "Iran": "ir",
    "Pakistan": "pk",
    "Bangladesh": "bd",
    "Nigeria": "ng",
    "Egypt": "eg",
    "South Africa": "za",
    "Argentina": "ar",
    "Chile": "cl",
    "Colombia": "co",
    "Peru": "pe",
    "Venezuela": "ve",
    "Ecuador": "ec",
    "Bolivia": "bo",
    "Uruguay": "uy",
    "Paraguay": "py",
    "Guyana": "gy",
    "Suriname": "sr",
    
    // European countries
    "Netherlands": "nl",
    "Belgium": "be",
    "Switzerland": "ch",
    "Austria": "at",
    "Sweden": "se",
    "Norway": "no",
    "Denmark": "dk",
    "Finland": "fi",
    "Poland": "pl",
    "Czech Republic": "cz",
    "Czechia": "cz",
    "Hungary": "hu",
    "Romania": "ro",
    "Bulgaria": "bg",
    "Greece": "gr",
    "Portugal": "pt",
    "Ireland": "ie",
    "Croatia": "hr",
    "Serbia": "rs",
    "Bosnia": "ba",
    "Bosnia and Herzegovina": "ba",
    "Montenegro": "me",
    "North Macedonia": "mk",
    "Albania": "al",
    "Slovenia": "si",
    "Slovakia": "sk",
    "Estonia": "ee",
    "Latvia": "lv",
    "Lithuania": "lt",
    "Belarus": "by",
    "Ukraine": "ua",
    "Moldova": "md",
    "Georgia": "ge",
    "Armenia": "am",
    "Azerbaijan": "az",
    "Kazakhstan": "kz",
    "Uzbekistan": "uz",
    "Kyrgyzstan": "kg",
    "Tajikistan": "tj",
    "Turkmenistan": "tm",
    
    // Asian countries
    "Thailand": "th",
    "Vietnam": "vn",
    "Malaysia": "my",
    "Singapore": "sg",
    "Philippines": "ph",
    "Myanmar": "mm",
    "Cambodia": "kh",
    "Laos": "la",
    "Brunei": "bn",
    "Mongolia": "mn",
    "Nepal": "np",
    "Bhutan": "bt",
    "Sri Lanka": "lk",
    "Maldives": "mv",
    "Afghanistan": "af",
    "Iraq": "iq",
    "Syria": "sy",
    "Lebanon": "lb",
    "Jordan": "jo",
    "Israel": "il",
    "Palestine": "ps",
    "Saudi Arabia": "sa",
    "UAE": "ae",
    "Qatar": "qa",
    "Kuwait": "kw",
    "Bahrain": "bh",
    "Oman": "om",
    "Yemen": "ye",
    
    // African countries
    "Morocco": "ma",
    "Algeria": "dz",
    "Tunisia": "tn",
    "Libya": "ly",
    "Sudan": "sd",
    "Ethiopia": "et",
    "Kenya": "ke",
    "Uganda": "ug",
    "Tanzania": "tz",
    "Rwanda": "rw",
    "Burundi": "bi",
    "Somalia": "so",
    "Djibouti": "dj",
    "Eritrea": "er",
    "Ghana": "gh",
    "Ivory Coast": "ci",
    "Côte d'Ivoire": "ci",
    "Senegal": "sn",
    "Mali": "ml",
    "Burkina Faso": "bf",
    "Niger": "ne",
    "Chad": "td",
    "Cameroon": "cm",
    "Central African Republic": "cf",
    "Gabon": "ga",
    "Equatorial Guinea": "gq",
    "Republic of the Congo": "cg",
    "Congo": "cg",
    "Democratic Republic of the Congo": "cd",
    "DRC": "cd",
    "Angola": "ao",
    "Zambia": "zm",
    "Zimbabwe": "zw",
    "Botswana": "bw",
    "Namibia": "na",
    "Lesotho": "ls",
    "Swaziland": "sz",
    "Eswatini": "sz",
    "Mozambique": "mz",
    "Madagascar": "mg",
    "Mauritius": "mu",
    "Seychelles": "sc",
    "Comoros": "km",
    "Cape Verde": "cv",
    "Cabo Verde": "cv",
    "Guinea": "gn",
    "Guinea-Bissau": "gw",
    "Sierra Leone": "sl",
    "Liberia": "lr",
    "Gambia": "gm",
    "Benin": "bj",
    "Togo": "tg",
    
    // Oceania
    "New Zealand": "nz",
    "Papua New Guinea": "pg",
    "Fiji": "fj",
    "Solomon Islands": "sb",
    "Vanuatu": "vu",
    "Samoa": "ws",
    "Tonga": "to",
    "Kiribati": "ki",
    "Tuvalu": "tv",
    "Nauru": "nr",
    "Palau": "pw",
    "Marshall Islands": "mh",
    "Micronesia": "fm",
    
    // Caribbean and small nations
    "Cuba": "cu",
    "Jamaica": "jm",
    "Haiti": "ht",
    "Dominican Republic": "do",
    "Trinidad and Tobago": "tt",
    "Barbados": "bb",
    "Bahamas": "bs",
    "Belize": "bz",
    "Costa Rica": "cr",
    "Panama": "pa",
    "Nicaragua": "ni",
    "Honduras": "hn",
    "El Salvador": "sv",
    "Guatemala": "gt",
    "Grenada": "gd",
    "Saint Lucia": "lc",
    "Saint Vincent and the Grenadines": "vc",
    "Antigua and Barbuda": "ag",
    "Dominica": "dm",
    "Saint Kitts and Nevis": "kn",
    
    // Special territories and regions
    "Hong Kong": "hk",
    "Macao": "mo",
    "Taiwan": "tw",
    "Greenland": "gl",
    "Faroe Islands": "fo",
    "Iceland": "is",
    "Malta": "mt",
    "Cyprus": "cy",
    "Luxembourg": "lu",
    "Liechtenstein": "li",
    "Monaco": "mc",
    "San Marino": "sm",
    "Vatican": "va",
    "Holy See (Vatican City State)": "va",
    "Andorra": "ad",
    
    // Overseas territories
    "French Guiana": "gf",
    "Guadeloupe": "gp",
    "Martinique": "mq",
    "Mayotte": "yt",
    "Réunion": "re",
    "New Caledonia": "nc",
    "French Polynesia": "pf",
    "Saint Pierre and Miquelon": "pm",
    "Wallis and Futuna": "wf",
    "Saint Barthélemy": "bl",
    "Saint Martin": "mf",
    "Aruba": "aw",
    "Curaçao": "cw",
    "Sint Maarten": "sx",
    "Caribbean Netherlands": "bq",
    "Bonaire": "bq",
    "Saba": "bq",
    "Sint Eustatius": "bq",
    "British Virgin Islands": "vg",
    "Cayman Islands": "ky",
    "Turks and Caicos Islands": "tc",
    "Montserrat": "ms",
    "Anguilla": "ai",
    "Bermuda": "bm",
    "Falkland Islands": "fk",
    "Falkland Islands (Malvinas)": "fk",
    "South Georgia": "gs",
    "Saint Helena": "sh",
    "Gibraltar": "gi",
    "Isle of Man": "im",
    "Jersey": "je",
    "Guernsey": "gg",
    "Channel Islands": "je", // Using Jersey as representative
    "Cook Islands": "ck",
    "Niue": "nu",
    "Tokelau": "tk",
    "American Samoa": "as",
    "Guam": "gu",
    "Northern Mariana Islands": "mp",
    "Puerto Rico": "pr",
    "US Virgin Islands": "vi",
    
    // Additional mappings for common variations
    "Korea, South": "kr",
    "Korea": "kr",
    "North Korea": "kp",
    "Congo (Brazzaville)": "cg",
    "Congo (Kinshasa)": "cd",
    "Timor-Leste": "tl",
    "East Timor": "tl",
    "Burma": "mm",
    "Macedonia": "mk",
    "Slovak Republic": "sk",
    "Herzegovina": "ba",
    "Diamond Princess": "xx", // Special case for cruise ship
    "MS Zaandam": "xx", // Special case for cruise ship
  };

  static getInstance(): CountryMappingService {
    if (!CountryMappingService.instance) {
      CountryMappingService.instance = new CountryMappingService();
    }
    return CountryMappingService.instance;
  }

  /**
   * Convert country name to ISO2 code
   */
  getISO2Code(countryName: string): string | null {
    // Direct lookup
    const directMatch = this.countryNameToISO2[countryName];
    if (directMatch) return directMatch;

    // Try case-insensitive lookup
    const lowerName = countryName.toLowerCase();
    for (const [name, code] of Object.entries(this.countryNameToISO2)) {
      if (name.toLowerCase() === lowerName) {
        return code;
      }
    }

    // Try partial matching for common variations
    for (const [name, code] of Object.entries(this.countryNameToISO2)) {
      if (name.toLowerCase().includes(lowerName) || lowerName.includes(name.toLowerCase())) {
        return code;
      }
    }

    console.warn(`No ISO2 code found for country: ${countryName}`);
    return null;
  }

  /**
   * Get all supported countries
   */
  getSupportedCountries(): string[] {
    return Object.keys(this.countryNameToISO2);
  }

  /**
   * Check if country is supported
   */
  isCountrySupported(countryName: string): boolean {
    return this.getISO2Code(countryName) !== null;
  }

  /**
   * Get mapping statistics
   */
  getMappingStats(): { total: number; mapped: number; unmapped: string[] } {
    return {
      total: Object.keys(this.countryNameToISO2).length,
      mapped: Object.keys(this.countryNameToISO2).length,
      unmapped: []
    };
  }
}

export const countryMappingService = CountryMappingService.getInstance();