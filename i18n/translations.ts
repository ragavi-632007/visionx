export type SupportedLanguage = 'en' | 'ta' | 'te';

type Translations = Record<SupportedLanguage, Record<string, string>>;

export const translations: Translations = {
  en: {
    "app.title": 'LexiGem',
    "common.login": 'Login',
    "common.signup": 'Sign Up',
    "common.dashboard": 'Dashboard',
    "common.logout": 'Logout',
    "common.language": 'Language',

    "tabs.analysis": 'Legal Analysis',
    "tabs.documents": 'Documents',
    "tabs.chatHistory": 'Chat History',
    "tabs.qa": 'Legal Q&A',

    "disclaimer.title": 'Disclaimer',
    "disclaimer.body": 'This is an AI-generated summary for informational purposes only and does not constitute legal advice.',

    "qa.placeholder": 'Ask a legal question...',
    "qa.empty.line1": 'Ask me anything about legal terms, contracts, or user rights.',
    "qa.empty.line2": 'For example: "What is an NDA?" or "Explain intellectual property".',

    "analysis.uploadLabel": 'Upload a document (PDF, DOCX, PNG, JPG)',
    "analysis.or": 'or',
    "analysis.browse": 'Browse Files',
    "analysis.analyze": 'Analyze Document',
    "analysis.savingSuccess": 'Saved to your documents.',
    "analysis.error.noFile": 'Please upload a document to analyze.',

    "analysis.section.summary": 'Summary',
    "analysis.section.pros": 'Pros',
    "analysis.section.cons": 'Cons',
    "analysis.section.loopholes": 'Potential Loopholes',
    "analysis.section.challenges": 'Potential Challenges',
    "analysis.badge.legal.true": 'Likely Legal',
    "analysis.badge.legal.false": 'Not Clearly Legal',
    "analysis.badge.auth.real": 'Likely Real',
    "analysis.badge.auth.fake": 'Likely Fake',
    "analysis.badge.auth.unknown": 'Unknown',
  },
  ta: {
    "app.title": 'LexiGem',
    "common.login": 'உள்நுழை',
    "common.signup": 'பதிவு செய்ய',
    "common.dashboard": 'டாஷ்போர்டு',
    "common.logout": 'வெளியேறு',
    "common.language": 'மொழி',

    "tabs.analysis": 'சட்ட பகுப்பாய்வு',
    "tabs.documents": 'ஆவணங்கள்',
    "tabs.chatHistory": 'அரட்டை வரலாறு',
    "tabs.qa": 'சட்ட கேள்வி & பதில்',

    "disclaimer.title": 'துறப்புக் குறிப்பு',
    "disclaimer.body": 'இது தகவல் நோக்கத்திற்கான AI உருவாக்கிய சுருக்கம் மட்டுமே; இது சட்ட ஆலோசனை அல்ல.',

    "qa.placeholder": 'ஒரு சட்டக் கேள்வியை கேளுங்கள்...',
    "qa.empty.line1": 'சட்ட சொற்கள், ஒப்பந்தங்கள், அல்லது பயனர் உரிமைகள் குறித்து கேளுங்கள்.',
    "qa.empty.line2": 'உதாரணம்: "NDA என்றால் என்ன?" அல்லது "மூலதன உரிமையை விளக்குங்கள்".',

    "analysis.uploadLabel": 'ஒரு ஆவணத்தை பதிவேற்றவும் (PDF, DOCX, PNG, JPG)',
    "analysis.or": 'அல்லது',
    "analysis.browse": 'கோப்புகளைத் தேர்ந்தெடு',
    "analysis.analyze": 'ஆவணத்தை பகுப்பாய்வு செய்',
    "analysis.savingSuccess": 'உங்கள் ஆவணங்களில் சேமிக்கப்பட்டது.',
    "analysis.error.noFile": 'பகுப்பாய்வு செய்ய ஒரு ஆவணத்தை பதிவேற்றவும்.',

    "analysis.section.summary": 'சுருக்கம்',
    "analysis.section.pros": 'நன்மைகள்',
    "analysis.section.cons": 'குறைகள்',
    "analysis.section.loopholes": 'சாத்தியமான குறுக்குவழிகள்',
    "analysis.section.challenges": 'சாத்தியமான சவால்கள்',
    "analysis.badge.legal.true": 'சட்டபூர்வமாக இருக்கலாம்',
    "analysis.badge.legal.false": 'தெளிவாக சட்டபூர்வமல்ல',
    "analysis.badge.auth.real": 'உண்மையாக இருக்கலாம்',
    "analysis.badge.auth.fake": 'பொய்யாக இருக்கலாம்',
    "analysis.badge.auth.unknown": 'தெரியாது',
  },
  te: {
    "app.title": 'LexiGem',
    "common.login": 'లాగిన్',
    "common.signup": 'సైన్ అప్',
    "common.dashboard": 'డాష్‌బోర్డ్',
    "common.logout": 'లాగౌట్',
    "common.language": 'భాష',

    "tabs.analysis": 'చట్ట విశ్లేషణ',
    "tabs.documents": 'పత్రాలు',
    "tabs.chatHistory": 'చాట్ చరిత్ర',
    "tabs.qa": 'చట్ట ప్రశ్నలు & సమాధానాలు',

    "disclaimer.title": 'అస్వీకరణ',
    "disclaimer.body": 'ఇది సమాచారం కోసం మాత్రమే AI రూపొందించిన సారాంశం; ఇది చట్ట సలహా కాదు.',

    "qa.placeholder": 'ఒక చట్ట సంబంధిత ప్రశ్న అడగండి...',
    "qa.empty.line1": 'చట్ట పదాలు, ఒప్పందాలు లేదా వినియోగదారుల హక్కుల గురించి అడగండి.',
    "qa.empty.line2": 'ఉదా: "NDA అంటే ఏమిటి?" లేదా "మేధస్సు సంపత్తి వివరించండి".',

    "analysis.uploadLabel": 'ఒక పత్రాన్ని అప్లోడ్ చేయండి (PDF, DOCX, PNG, JPG)',
    "analysis.or": 'లేదా',
    "analysis.browse": 'ఫైళ్లను చూడండి',
    "analysis.analyze": 'పత్రాన్ని విశ్లేషించండి',
    "analysis.savingSuccess": 'మీ పత్రాలకు సేవ్ చేయబడింది.',
    "analysis.error.noFile": 'విశ్లేషణ కోసం ఒక పత్రాన్ని అప్లోడ్ చేయండి.',

    "analysis.section.summary": 'సారాంశం',
    "analysis.section.pros": 'ప్రయోజనాలు',
    "analysis.section.cons": 'ప్రతికూలాలు',
    "analysis.section.loopholes": 'సంభావ్య లోపాలు',
    "analysis.section.challenges": 'సంభావ్య సవాళ్లు',
    "analysis.badge.legal.true": 'చట్టబద్ధంగా ఉండవచ్చు',
    "analysis.badge.legal.false": 'స్పష్టంగా చట్టబద్ధం కాదు',
    "analysis.badge.auth.real": 'నిజమై ఉండవచ్చు',
    "analysis.badge.auth.fake": 'నకిలీగా ఉండవచ్చు',
    "analysis.badge.auth.unknown": 'తెలియదు',
  },
};

export const languageNames: Record<SupportedLanguage, string> = {
  en: 'English',
  ta: 'தமிழ்',
  te: 'తెలుగు',
};


