import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Send, Mic, Paperclip, Copy, RotateCcw, ThumbsUp, ThumbsDown, 
  Sparkles, Bot, Clock, AlertTriangle, ShieldCheck, MapPin, 
  HelpCircle, ChevronDown, CheckCircle2, Volume2, PlusCircle,
  FileText, Activity, AlertCircle, BarChart3, ShieldAlert
} from 'lucide-react';

const translations: Record<string, {
  subtitle: string;
  chatTab: string;
  capsTab: string;
  welcomeHeading: string;
  welcomeDesc: string;
  quickSuggestions: string;
  emptyHeading: string;
  emptyDesc: string;
  inputPlaceholder: string;
  recordingLabel: string;
  recordingCancel: string;
  regenerateLabel: string;
  activeContextHeading: string;
  hideContext: string;
  loadSimulation: string;
  queryStatus: string;
  openLiveMap: string;
  dialogHeading: string;
  actionsHeading: string;
  defaultReply: string;
  voiceInputTrigger: string;
  attachmentAlert: string;
  attachedText: string;
  chips: Array<{ text: string; key: string }>;
  dialogs: Array<{ q: string; r: string }>;
  actions: Array<{ label: string; route: string; icon: string }>;
  autoReplies: Record<string, string>;
  capabilitiesTitle: string;
  capabilitiesSubtitle: string;
  capabilitiesDesc: string;
  capabilities: Array<{ title: string; desc: string; icon: string }>;
}> = {
  English: {
    subtitle: "Your intelligent civic assistant",
    chatTab: "Interactive Chat",
    capsTab: "AI Capabilities",
    welcomeHeading: "How can I help today?",
    welcomeDesc: "I am trained specifically on local municipal charters, water pressure anomalies, streetlamp maintenance logs, and flood telemetry algorithms.",
    quickSuggestions: "Quick Suggestions",
    emptyHeading: "Ask anything about your community.",
    emptyDesc: "Type a question, select a quick suggestion, or hold down the micro-sensor to log audio dispatches.",
    inputPlaceholder: "Type an issue, e.g. streetlight broken...",
    recordingLabel: "Hold to speak / Recording Live Audio",
    recordingCancel: "Cancel",
    regenerateLabel: "Regenerate Response",
    activeContextHeading: "Active Issue Context",
    hideContext: "Hide Context",
    loadSimulation: "Load Simulation",
    queryStatus: "Query Status",
    openLiveMap: "Open Live Map",
    dialogHeading: "Smart Dialog Scenarios",
    actionsHeading: "Quick Action Modules",
    defaultReply: "I appreciate you bringing this to my attention. I will route this description to our municipal parsing pipeline to identify the category, coordinate offsets, and appropriate dispatch office.",
    voiceInputTrigger: "Voice input: Streetlight broken on Indiranagar road",
    attachmentAlert: "Evidence photo uploaded successfully.",
    attachedText: "Evidence Photo Attached",
    chips: [
      { text: '📷 Report an Issue', key: 'report an issue' },
      { text: '📍 Track Complaint', key: 'track complaint' },
      { text: '📊 Nearby Issues', key: 'nearby issues' },
      { text: '🏛 Ward Performance', key: 'ward performance' },
      { text: '🌧 Flood Prediction', key: 'flood prediction' },
      { text: '🚰 Water Leakage', key: 'water leakage' },
      { text: '💡 Streetlight Issue', key: 'streetlight issue' }
    ],
    dialogs: [
      { q: "There is a large pothole near my house.", r: "I can help you report it. Would you like to upload a photo?" },
      { q: "Show nearby issues.", r: "I found 8 active issues within 1 km." },
      { q: "Why is my complaint delayed?", r: "Your complaint is currently awaiting community verification." }
    ],
    actions: [
      { label: 'Report Issue', route: '#report-issue', icon: '📝' },
      { label: 'Track Complaint', route: '#citizen-dashboard', icon: '🔍' },
      { label: 'Nearby Issues', route: '#live-map', icon: '📍' },
      { label: 'Community Verify', route: '#transparency', icon: '🤝' },
      { label: 'Emergency Contacts', route: '#how-it-works', icon: '📞' },
      { label: 'Ward Dashboard', route: '#transparency', icon: '📊' }
    ],
    autoReplies: {
      'report an issue': "I can help you report a civic issue. Would you like to upload a photo first? Simply describe what's wrong, and I'll extract the category, severity, and department automatically.",
      'track complaint': "Sure! Please enter your Complaint ID (e.g. CQ-3948) or query: 'Why is my complaint delayed?'. I will instantly trace its current lifecycle state on our transparent database.",
      'nearby issues': "I have scanned the geo-coordinates. I found 8 active reports within 1 km of your location, primarily categorized under 'Street Lighting' and 'Road Potholes'. 3 of these are currently undergoing community verification.",
      'ward performance': "Analyzing local records... Indiranagar currently holds the highest resolution efficiency rate at 96.2%, followed by Koramangala at 94.5%.",
      'flood prediction': "Running predictive spatial-temporal hydrology model... Based on historical stormwater patterns and the 70mm forecast for next week, Sector 4 (Koramangala) has a HIGH inundation warning index. Emergency desilting is recommended.",
      'water leakage': "Water utility alert registered. I will match this with current pressure sensor drops in local lines and dispatch a repair ticket to the BWSSB maintenance division.",
      'streetlight issue': "Electrical asset grid mapped. Streetlamp outages can compromise safety. I've logged an automatic inspection order to the local power board (BESCOM) with a standard 24-hour SLA.",
      'there is a large pothole near my house.': "I can help you report it. Would you like to upload a photo?",
      'show nearby issues.': "I found 8 active issues within 1 km.",
      'why is my complaint delayed?': "Your complaint is currently awaiting community verification.",
      'which ward performs the best?': "Ward 12 currently has the highest resolution rate.",
      'will my area flood?': "Based on historical trends, this area has a medium flooding risk."
    },
    capabilitiesTitle: "Core Models",
    capabilitiesSubtitle: "CivicQ Deep Learning Pipeline",
    capabilitiesDesc: "Our specialized intelligence layer processes unstructured visual and text payloads to minimize municipal triage cycles.",
    capabilities: [
      { title: 'Image Understanding', desc: 'Analyzes user uploads to identify precise asset failure characteristics (e.g. depth of pothole or pipe fissure type).', icon: '👁️' },
      { title: 'Issue Categorization', desc: 'Translates colloquial citizen text into structural municipal categories aligned with official ward charters.', icon: '🏷️' },
      { title: 'Severity Detection', desc: 'Evaluates public safety index triggers to adjust priority ranking dynamically on official ledgers.', icon: '⚠️' },
      { title: 'Duplicate Detection', desc: 'Clusters multiple nearby reports describing the exact same street incident into single cohesive dispatches.', icon: '📂' },
      { title: 'Predictive Insights', desc: 'Examines geographic historical records and forecasting indices to forecast sewer backups or road crumbling.', icon: '📈' },
      { title: 'Resolution Verification', desc: 'Compares before & after coordinate photographs via computer vision to guarantee complete repair proof.', icon: '✅' }
    ]
  },
  Hindi: {
    subtitle: "आपका बुद्धिमान नागरिक सहायक",
    chatTab: "इंटरएक्टिव चैट",
    capsTab: "एआई क्षमताएं",
    welcomeHeading: "आज मैं आपकी क्या सहायता कर सकता हूँ?",
    welcomeDesc: "मुझे विशेष रूप से स्थानीय नगरपालिका नियमों, पानी के दबाव की विसंगतियों, स्ट्रीटलाइट रखरखाव लॉग और बाढ़ टेलीमेट्री एल्गोरिदम पर प्रशिक्षित किया गया है।",
    quickSuggestions: "त्वरित सुझाव",
    emptyHeading: "अपने समुदाय के बारे में कुछ भी पूछें।",
    emptyDesc: "कोई प्रश्न टाइप करें, कोई त्वरित सुझाव चुनें, या ऑडियो भेजने के लिए माइक्रोफ़ोन बटन दबाए रखें।",
    inputPlaceholder: "एक समस्या टाइप करें, उदा. स्ट्रीटलाइट खराब है...",
    recordingLabel: "बोलने के लिए दबाए रखें / लाइव ऑडियो रिकॉर्ड हो रहा है",
    recordingCancel: "रद्द करें",
    regenerateLabel: "प्रतिक्रिया पुनरुत्पादित करें",
    activeContextHeading: "सक्रिय समस्या संदर्भ",
    hideContext: "संदर्भ छिपाएं",
    loadSimulation: "सिमुलेशन लोड करें",
    queryStatus: "स्थिति पूछताछ",
    openLiveMap: "लाइव मानचित्र खोलें",
    dialogHeading: "स्मार्ट संवाद परिदृश्य",
    actionsHeading: "त्वरित कार्रवाई मॉड्यूल",
    defaultReply: "मैं इस समस्या को हमारे ध्यान में लाने के लिए आपकी सराहना करता हूँ। मैं इस विवरण को हमारे नगरपालिका विश्लेषण तंत्र में भेज दूँगा ताकि श्रेणी, स्थान निर्देशांक और उपयुक्त विभाग की पहचान हो सके।",
    voiceInputTrigger: "वॉयस इनपुट: इंदिरा नगर रोड पर स्ट्रीटलाइट खराब है",
    attachmentAlert: "प्रमाण फोटो सफलतापूर्वक अपलोड किया गया।",
    attachedText: "प्रमाण फोटो संलग्न",
    chips: [
      { text: '📷 समस्या की रिपोर्ट करें', key: 'report an issue' },
      { text: '📍 शिकायत ट्रैक करें', key: 'track complaint' },
      { text: '📊 आस-पास की समस्याएं', key: 'nearby issues' },
      { text: '🏛 वार्ड का प्रदर्शन', key: 'ward performance' },
      { text: '🌧 बाढ़ का पूर्वानुमान', key: 'flood prediction' },
      { text: '🚰 पानी का रिसाव', key: 'water leakage' },
      { text: '💡 स्ट्रीटलाइट की समस्या', key: 'streetlight issue' }
    ],
    dialogs: [
      { q: "मेरे घर के पास एक बड़ा गड्ढा है।", r: "मैं इसे रिपोर्ट करने में आपकी मदद कर सकता हूँ। क्या आप एक फोटो अपलोड करना चाहेंगे?" },
      { q: "आस-पास की समस्याएं दिखाएं।", r: "मुझे 1 किमी के भीतर 8 सक्रिय समस्याएं मिली हैं।" },
      { q: "मेरी शिकायत में देरी क्यों हो रही है?", r: "आपकी शिकायत वर्तमान में सामुदायिक सत्यापन की प्रतीक्षा कर रही है।" }
    ],
    actions: [
      { label: 'समस्या की रिपोर्ट', route: '#report-issue', icon: '📝' },
      { label: 'शिकायत ट्रैक करें', route: '#citizen-dashboard', icon: '🔍' },
      { label: 'आस-पास की समस्याएं', route: '#live-map', icon: '📍' },
      { label: 'सामुदायिक सत्यापन', route: '#transparency', icon: '🤝' },
      { label: 'आपातकालीन संपर्क', route: '#how-it-works', icon: '📞' },
      { label: 'वार्ड डैशबोर्ड', route: '#transparency', icon: '📊' }
    ],
    autoReplies: {
      'report an issue': "मैं आपको एक नागरिक समस्या की रिपोर्ट करने में मदद कर सकता हूँ। क्या आप पहले एक फोटो अपलोड करना चाहेंगे? बस समस्या का वर्णन करें, और मैं स्वचालित रूप से श्रेणी, गंभीरता और विभाग का पता लगा लूँगा।",
      'track complaint': "ज़रूर! कृपया अपनी शिकायत आईडी (जैसे CQ-3948) दर्ज करें या पूछें: 'मेरी शिकायत में देरी क्यों हो रही है?'। मैं तुरंत हमारे पारदर्शी डेटाबेस पर इसकी वर्तमान स्थिति का पता लगाऊँगा।",
      'nearby issues': "मैंने भौगोलिक निर्देशांकों को स्कैन किया है। मुझे आपके स्थान के 1 किमी के भीतर 8 सक्रिय रिपोर्ट मिली हैं, जो मुख्य रूप से 'स्ट्रीट लाइटिंग' और 'सड़क के गड्ढों' के अंतर्गत वर्गीकृत हैं। इनमें से 3 वर्तमान में सामुदायिक सत्यापन के अधीन हैं।",
      'ward performance': "स्थानीय अभिलेखों का विश्लेषण किया जा रहा है... वार्ड 12 (इंदिरा नगर) में वर्तमान में सबसे अधिक समाधान दक्षता दर 96.2% है, इसके बाद वार्ड 84 (मल्लेश्वरम) 94.5% पर है।",
      'flood prediction': "पूर्वानुमानित जल विज्ञान मॉडल चल रहा है... ऐतिहासिक तूफानी जल पैटर्न और अगले सप्ताह के लिए 70 मिमी के पूर्वानुमान के आधार पर, सेक्टर 4 (कोरामंगला) में उच्च बाढ़ की चेतावनी है। आपातकालीन गाद निकालना अनुशंसित है।",
      'water leakage': "जल उपयोगिता चेतावनी दर्ज की गई। मैं इसे स्थानीय लाइनों में वर्तमान दबाव सेंसर की गिरावट के साथ मिलान करूँगा और जल आपूर्ति बोर्ड के रखरखाव विभाग को मरम्मत टिकट भेजूँगा।",
      'streetlight issue': "विद्युत संपदा ग्रिड मैप किया गया है। स्ट्रीटलाइट का खराब होना सुरक्षा से समझौता कर सकता है। मैंने मानक 24 घंटे की समय-सीमा के साथ स्थानीय बिजली बोर्ड (BESCOM) को एक स्वचालित निरीक्षण आदेश भेजा है।",
      'मेरे घर के पास एक बड़ा गड्ढा है।': "मैं इसे रिपोर्ट करने में आपकी मदद कर सकता हूँ। क्या आप एक फोटो अपलोड करना चाहेंगे?",
      'आस-पास की समस्याएं दिखाएं।': "मुझे 1 किमी के भीतर 8 सक्रिय समस्याएं मिली हैं।",
      'मेरी शिकायत में देरी क्यों हो रही है?': "आपकी शिकायत वर्तमान में सामुदायिक सत्यापन की प्रतीक्षा कर रही है।"
    },
    capabilitiesTitle: "मुख्य मॉडल",
    capabilitiesSubtitle: "CivicQ डीप लर्निंग पाइपलाइन",
    capabilitiesDesc: "हमारी विशेष बुद्धिमत्ता परत नगरपालिका कार्य समय को कम करने के लिए असंरचित दृश्य और पाठ पेलोड को संसाधित करती है।",
    capabilities: [
      { title: 'छवि की समझ', desc: 'सटीक संपत्ति विफलता विशेषताओं (जैसे गड्ढे की गहराई या पाइप दरार का प्रकार) की पहचान करने के लिए उपयोगकर्ता अपलोड का विश्लेषण करती है।', icon: '👁️' },
      { title: 'समस्या का वर्गीकरण', desc: 'नागरिकों की बोलचाल की भाषा को आधिकारिक वार्ड चार्टर के साथ संरेखित संरचनात्मक नगरपालिका श्रेणियों में अनुवादित करती है।', icon: '🏷️' },
      { title: 'गंभीरता का पता लगाना', desc: 'आधिकारिक बहीखातों पर गतिशील रूप से प्राथमिकता रैंकिंग को समायोजित करने के लिए सार्वजनिक सुरक्षा सूचकांक ट्रिगर्स का मूल्यांकन करती है।', icon: '⚠️' },
      { title: 'डुप्लिकेट का पता लगाना', desc: 'एक ही सड़क की घटना का वर्णन करने वाली आस-पास की कई रिपोर्टों को एकल सुसंगत प्रेषण में समूहित करती है।', icon: '📂' },
      { title: 'पूर्वानुमानित अंतर्दृष्टि', desc: 'सीवर बैकअप या सड़क टूटने का पूर्वानुमान लगाने के लिए भौगोलिक ऐतिहासिक रिकॉर्ड और पूर्वानुमान सूचकांकों की जांच करती है।', icon: '📈' },
      { title: 'समाधान सत्यापन', desc: 'पूर्ण मरम्मत के प्रमाण की गारंटी के लिए कंप्यूटर विजन के माध्यम से पहले और बाद की तस्वीरों की तुलना करती है।', icon: '✅' }
    ]
  },
  Kannada: {
    subtitle: "ನಿಮ್ಮ ಬುದ್ಧಿವಂತ ನಾಗರಿಕ ಸಹಾಯಕ",
    chatTab: "ಸಂವಾದಾತ್ಮಕ ಚಾಟ್",
    capsTab: "AI ಸಾಮರ್ಥ್ಯಗಳು",
    welcomeHeading: "ಇಂದು ನಾನು ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?",
    welcomeDesc: "ಸ್ಥಳೀಯ ಪುರಸಭೆಯ ನಿಯಮಾವಳಿಗಳು, ನೀರಿನ ಒತ್ತಡದ ವ್ಯತ್ಯಾಸಗಳು, ಬೀದಿದೀಪ ನಿರ್ವಹಣೆ ದಾಖಲೆಗಳು ಮತ್ತು ಪ್ರವಾಹದ ಮುನ್ಸೂಚನೆ ಅಲ್ಗಾರಿದಮ್‌ಗಳ ಬಗ್ಗೆ ನನಗೆ ವಿಶೇಷವಾಗಿ ತರಬೇತಿ ನೀಡಲಾಗಿದೆ.",
    quickSuggestions: "ತ್ವರಿತ ಸಲಹೆಗಳು",
    emptyHeading: "ನಿಮ್ಮ ಸಮುದಾಯದ ಬಗ್ಗೆ ಏನ್ನನ್ನಾದರೂ ಕೇಳಿ.",
    emptyDesc: "ಪ್ರಶ್ನೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ, ತ್ವರಿತ ಸಲಹೆಯನ್ನು ಆರಿಸಿ ಅಥವಾ ಆಡಿಯೊ ಕಳುಹಿಸಲು ಮೈಕ್ರೊಫೋನ್ ಬಟನ್ ಒತ್ತಿ ಹಿಡಿಯಿರಿ.",
    inputPlaceholder: "ಸಮಸ್ಯೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ, ಉದಾ: ಬೀದಿದೀಪ ಕೆಟ್ಟಿದೆ...",
    recordingLabel: "ಮಾತನಾಡಲು ಒತ್ತಿ ಹಿಡಿಯಿರಿ / ಲೈವ್ ಆಡಿಯೊ ರೆಕಾರ್ಡ್ ಆಗುತ್ತಿದೆ",
    recordingCancel: "ರದ್ದುಮಾಡಿ",
    regenerateLabel: "ಪ್ರತಿಕ್ರಿಯೆಯನ್ನು ಮರುಜನರೇಟ್ ಮಾಡಿ",
    activeContextHeading: "ಸಕ್ರಿಯ ಸಮಸ್ಯೆಯ ಸಂದರ್ಭ",
    hideContext: "ಸಂದರ್ಭವನ್ನ ಮರೆಮಾಡಿ",
    loadSimulation: "ಸಿಮ್ಯುಲೇಶನ್ ಲೋಡ್ ಮಾಡಿ",
    queryStatus: "ಸ್ಥಿತಿ ವಿಚಾರಣೆ",
    openLiveMap: "ಲೈವ್ ನಕ್ಷೆಯನ್ನು ತೆರೆಯಿರಿ",
    dialogHeading: "ಸ್ಮಾರ್ಟ್ ಸಂವಾದ ಸನ್ನಿವೇಶಗಳು",
    actionsHeading: "ತ್ವರಿತ ಕ್ರಮ ಮಾಡ್ಯೂಲ್‌ಗಳು",
    defaultReply: "ವಿಷಯವನ್ನು ನನ್ನ ಗಮನಕ್ಕೆ ತಂದಿದ್ದಕ್ಕಾಗಿ ಧನ್ಯವಾದಗಳು. ವರ್ಗ, ಸ್ಥಳದ ನಿರ್ದೇಶಾಂಕಗಳು ಮತ್ತು ಸೂಕ್ತ ಇಲಾಖೆಯನ್ನು ಪತ್ತೆಹಚ್ಚಲು ನಾನು ಈ ವಿವರಣೆಯನ್ನು ಪುರಸಭೆಯ ವಿಶ್ಲೇಷಣಾ ತಂಡಕ್ಕೆ ರವಾನಿಸುತ್ತೇನೆ.",
    voiceInputTrigger: "ಧ್ವನಿ ಇನ್ಪುಟ್: ಇಂದಿರಾನಗರ ರಸ್ತೆಯಲ್ಲಿ ಬೀದಿದೀಪ ಕೆಟ್ಟಿದೆ",
    attachmentAlert: "ಸಾಕ್ಷಿ ಫೋಟೋ ಯಶಸ್ವಿಯಾಗಿ ಅಪ್‌ಲೋಡ್ ಆಗಿದೆ.",
    attachedText: "ಸಾಕ್ಷಿ ಫೋಟೋ ಲಗತ್ತಿಸಲಾಗಿದೆ",
    chips: [
      { text: '📷 ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಿ', key: 'report an issue' },
      { text: '📍 ದೂರನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ', key: 'track complaint' },
      { text: '📊 ಹತ್ತಿರದ ಸಮಸ್ಯೆಗಳು', key: 'nearby issues' },
      { text: '🏛 ವಾರ್ಡ್ ಪ್ರದರ್ಶನ', key: 'ward performance' },
      { text: '🌧 ಪ್ರವಾಹದ ಮುನ್ಸೂಚನೆ', key: 'flood prediction' },
      { text: '🚰 ನೀರಿನ ಸೋರಿಕೆ', key: 'water leakage' },
      { text: '💡 ಬೀದಿದೀಪದ ಸಮಸ್ಯೆ', key: 'streetlight issue' }
    ],
    dialogs: [
      { q: "ನನ್ನ ಮನೆಯ ಹತ್ತಿರ ದೊಡ್ಡ ರಸ್ತೆ ಗುಂಡಿ ಇದೆ.", r: "ಅದನ್ನು ವರದಿ ಮಾಡಲು ನಾನು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ನೀವು ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಬಯಸುವಿರಾ?" },
      { q: "ಹತ್ತಿರದ ಸಮಸ್ಯೆಗಳನ್ನು ತೋರಿಸಿ.", r: "ನಾನು 1 ಕಿಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ 8 ಸಕ್ರಿಯ ಸಮಸ್ಯೆಗಳನ್ನು ಕಂಡುಕೊಂಡಿದ್ದೇನೆ." },
      { q: "ನನ್ನ ದೂರು ಏಕೆ ತಡವಾಗುತ್ತಿದೆ?", r: "ನಿಮ್ಮ ದೂರು ಸದ್ಯಕ್ಕೆ ಸಮುದಾಯ ಪರಿಶೀಲನೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ." }
    ],
    actions: [
      { label: 'ಸಮಸ್ಯೆ ವರದಿ', route: '#report-issue', icon: '📝' },
      { label: 'ದೂರು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ', route: '#citizen-dashboard', icon: '🔍' },
      { label: 'ಹತ್ತಿರದ ಸಮಸ್ಯೆಗಳು', route: '#live-map', icon: '📍' },
      { label: 'ಸಮುದಾಯ ಪರಿಶೀಲನೆ', route: '#transparency', icon: '🤝' },
      { label: 'ತುರ್ತು ಸಂಪರ್ಕಗಳು', route: '#how-it-works', icon: '📞' },
      { label: 'ವಾರ್ಡ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್', route: '#transparency', icon: '📊' }
    ],
    autoReplies: {
      'report an issue': "ನಾಗರಿಕ ಸಮಸ್ಯೆಯನ್ನು ವರದಿ ಮಾಡಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ನೀವು ಮೊದಲು ಫೋಟೋವನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಬಯಸುವಿರಾ? ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ, ನಾನು ವರ್ಗ, ತೀವ್ರತೆ ಮತ್ತು ಇಲಾಖೆಯನ್ನು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಗುರುತಿಸುತ್ತೇನೆ.",
      'track complaint': "ಖಂಡಿತ! ದಯವಿಟ್ಟು ನಿಮ್ಮ ದೂರು ಐಡಿಯನ್ನು ನಮೂದಿಸಿ (ಉದಾ. CQ-3948) ಅಥವಾ 'ನನ್ನ ದೂರು ಏಕೆ ತಡವಾಗುತ್ತಿದೆ?' ಎಂದು ಕೇಳಿ. ನಮ್ಮ ಪಾರದರ್ಶಕ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ ಅದರ ಪ್ರಸ್ತುತ ಸ್ಥಿತಿಯನ್ನು ನಾನು ತಕ್ಷಣವೇ ಟ್ರ್ಯಾಕ್ ಮಾಡುತ್ತೇನೆ.",
      'nearby issues': "ನಾನು ಭೌಗೋಳಿಕ ನಿರ್ದೇಶಾಂಕಗಳನ್ನು ಸ್ಕ್ಯಾನ್ ಮಾಡಿದ್ದೇನೆ. ನಿಮ್ಮ ಸ್ಥಳದಿಂದ 1 ಕಿಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ 8 ಸಕ್ರಿಯ ವರದಿಗಳನ್ನು ಕಂಡುಕೊಂಡಿದ್ದೇನೆ, ಮುಖ್ಯವಾಗಿ 'ಬೀದಿ ದೀಪಗಳು' ಮತ್ತು 'ರಸ್ತೆ ಗುಂಡಿಗಳು' ಎಂದು ವರ್ಗೀಕರಿಸಲಾಗಿದೆ.",
      'ward performance': "ಸ್ಥಳೀಯ ದಾಖಲೆಗಳ ವಿಶ್ಲೇಷಣೆ... ವಾರ್ಡ್ 12 (ಇಂದಿರಾನಗರ) ಪ್ರಸ್ತುತ 96.2% ರಷ್ಟು ಹೆಚ್ಚಿನ ಪರಿಹಾರ ದಕ್ಷತೆಯನ್ನು ಹೊಂದಿದೆ, ನಂತರ ವಾರ್ಡ್ 84 (ಮಲ್ಲೇಶ್ವರಂ) 94.5% ರಷ್ಟಿದೆ.",
      'flood prediction': "ಪ್ರವಾಹ ಮುನ್ಸೂಚನೆ ಮಾದರಿ ಚಾಲನೆಯಲ್ಲಿದೆ... ಮುಂದಿನ ವಾರಕ್ಕೆ 70mm ಮಳೆಯ ಮುನ್ಸೂಚನೆಯ ಆಧಾರದ ಮೇಲೆ, ಸೆಕ್ಟರ್ 4 (ಕೋರಮಂಗಲ) ಪ್ರವಾಹದ ಹೆಚ್ಚಿನ ಮುನ್ಸೂಚನೆಯನ್ನು ಹೊಂದಿದೆ. ತುರ್ತು ಹೂಳೆತ್ತುವಿಕೆಯನ್ನು ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ.",
      'water leakage': "ನೀರಿನ ಸೋರಿಕೆ ಎಚ್ಚರಿಕೆ ದಾಖಲಾಗಿದೆ. ಸ್ಥಳೀಯ ಲೈನ್‌ಗಳಲ್ಲಿ ನೀರಿನ ಒತ್ತಡದ ಸಂವೇದಕಗಳ ಕುಸಿತದೊಂದಿಗೆ ನಾನು ಇದನ್ನು ಪರಿಶೀಲಿಸುತ್ತೇನೆ ಮತ್ತು ದುರಸ್ತಿ ಆದೇಶವನ್ನು BWSSB ನಿರ್ವಹಣಾ ವಿಭಾಗಕ್ಕೆ ಕಳುಹಿಸುತ್ತೇನೆ.",
      'streetlight issue': "ಬೀದಿದೀಪಗಳ ಗ್ರಿಡ್ ಮ್ಯಾಪ್ ಮಾಡಲಾಗಿದೆ. ಬೀದಿದೀಪಗಳು ಕೆಟ್ಟಿರುವುದು ಸುರಕ್ಷತೆಗೆ ಧಕ್ಕೆ ತರಬಹುದು. ನಾನು ಸ್ಥಳೀಯ ವಿದ್ಯುತ್ ಮಂಡಳಿಗೆ (BESCOM) 24 ಗಂಟೆಗಳ SLA ನೊಂದಿಗೆ ಸ್ವಯಂಚಾಲಿತ ತಪಾಸಣೆ ಆದೇಶವನ್ನು ಕಳುಹಿಸಿದ್ದೇನೆ.",
      'ನನ್ನ ಮನೆಯ ಹತ್ತಿರ ದೊಡ್ಡ ರಸ್ತೆ ಗುಂಡಿ ಇದೆ.': "ಅದನ್ನು ವರದಿ ಮಾಡಲು ನಾನು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ನೀವು ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಲು ಬಯಸುವಿರಾ?",
      'ಹತ್ತಿರದ ಸಮಸ್ಯೆಗಳನ್ನು ತೋರಿಸಿ.': "ನಾನು 1 ಕಿಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ 8 ಸಕ್ರಿಯ ಸಮಸ್ಯೆಗಳನ್ನು ಕಂಡುಕೊಂಡಿದ್ದೇನೆ.",
      'ನನ್ನ ದೂರು ಏಕೆ ತಡವಾಗುತ್ತಿದೆ?': "ನಿಮ್ಮ ದೂರು ಸದ್ಯಕ್ಕೆ ಸಮುದಾಯ ಪರಿಶೀಲನೆಗಾಗಿ ಕಾಯುತ್ತಿದೆ."
    },
    capabilitiesTitle: "ಪ್ರಮುಖ ಮಾದರಿಗಳು",
    capabilitiesSubtitle: "CivicQ ಡೀಪ್ ಲರ್ನಿಂಗ್ ಪೈಪ್‌ಲೈನ್",
    capabilitiesDesc: "ನಮ್ಮ ವಿಶೇಷ ಬುದ್ಧಿಮತ್ತೆ ಪದರವು ಪುರಸಭೆಯ ಕೆಲಸದ ಸಮಯವನ್ನು ಕಡಿಮೆ ಮಾಡಲು ಸಂಘಟಿತವಲ್ಲದ ದೃಶ್ಯ ಮತ್ತು ಪಠ್ಯ ಪೇಲೋಡ್‌ಗಳನ್ನು ಸಂಸ್ಕರಿಸುತ್ತದೆ.",
    capabilities: [
      { title: 'ಚಿತ್ರದ ಗ್ರಹಿಕೆ', desc: 'ನಿಖರವಾದ ಆಸ್ತಿ ವೈಫಲ್ಯದ ಗುಣಲಕ್ಷಣಗಳನ್ನು (ಉದಾ. ರಸ್ತೆ ಗುಂಡಿ ಆಳ ಅಥವಾ ಪೈಪ್ ಒಡೆದಿರುವಿಕೆ) ಪತ್ತೆಹಚ್ಚಲು ಬಳಕೆದಾರರು ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಚಿತ್ರಗಳನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತದೆ.', icon: '👁️' },
      { title: 'ಸಮಸ್ಯೆಯ ವರ್ಗೀಕರಣ', desc: 'ನಾಗರಿಕರ ಆಡುಭಾಷೆಯನ್ನು ಅಧಿಕೃತ ವಾರ್ಡ್ ಚಾರ್ಟರ್‌ಗಳೊಂದಿಗೆ ಜೋಡಿಸಲಾದ ಪುರಸಭೆಯ ವರ್ಗಗಳಿಗೆ ಅನುವಾದಿಸುತ್ತದೆ.', icon: '🏷️' },
      { title: 'ತೀವ್ರತೆಯ ಪತ್ತೆಹಚ್ಚುವಿಕೆ', desc: 'ಅಧಿಕೃತ ದಾಖಲೆಗಳಲ್ಲಿ ಆದ್ಯತೆಯ ಶ್ರೇಯಾಂಕವನ್ನು ಹೊಂದಿಸಲು ಸಾರ್ವಜನಿಕ ಸುರಕ್ಷತೆಯ ಸೂಚ್ಯಂಕಗಳನ್ನು ಮೌಲ್ಯಮಾಪನ ಮಾಡುತ್ತದೆ.', icon: '⚠️' },
      { title: 'ನಕಲಿ ವರದಿಗಳ ಪತ್ತೆ', desc: 'ಒಂದೇ ರಸ್ತೆ ಘಟನೆಯನ್ನು ವಿವರಿಸುವ ಹತ್ತಿರದ ಅನೇಕ ವರದಿಗಳನ್ನು ಒಂದೇ ವರದಿಯನ್ನಾಗಿ ಸಂಯೋಜಿಸುತ್ತದೆ.', icon: '📂' },
      { title: 'ಮುನ್ಸೂಚನೆ ಮಾಹಿತಿ', desc: 'ಒಳಚರಂಡಿ ಬ್ಲಾಕ್ ಅಥವಾ ರಸ್ತೆ ಹಾನಿಯನ್ನು ಮುನ್ಸೂಚಿಸಲು ಭೌಗೋಳಿಕ ಐತಿಹಾಸಿಕ ದಾಖಲೆಗಳು ಮತ್ತು ಹವಾಮಾನ ಮುನ್ಸೂಚನೆಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ.', icon: '📈' },
      { title: 'ಪರಿಹಾರದ ಪರಿಶೀಲನೆ', desc: 'ಸಂಪೂರ್ಣ ದುರಸ್ತಿಯ ಪುರಾವೆಯನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ಕಂಪ್ಯೂಟರ್ ದೃಷ್ಟಿ ಮೂಲಕ ದುರಸ್ತಿಗಿಂತ ಮುಂಚಿನ ಮತ್ತು ನಂತರದ ಚಿತ್ರಗಳನ್ನು ಹೋಲಿಸುತ್ತದೆ.', icon: '✅' }
    ]
  },
  Telugu: {
    subtitle: "మీ స్మార్ట్ పౌర సహాయకుడు",
    chatTab: "ఇంటరాక్టివ్ చాట్",
    capsTab: "AI సామర్థ్యాలు",
    welcomeHeading: "ఈరోజు నేను మీకు ఎలా సహాయం చేయగలను?",
    welcomeDesc: "స్థానిక మునిసిపల్ నిబంధనలు, నీటి ఒత్తిడి వ్యత్యాసాలు, వీధిలైట్ల నిర్వహణ లాగ్‌లు మరియు వరద టెలిమెట్రీ అల్గారిథమ్‌లపై నాకు ప్రత్యేక శిక్షణ ఉంది.",
    quickSuggestions: "త్వరిత సూచనలు",
    emptyHeading: "మీ సంఘం గురించి ఏదైనా అడగండి.",
    emptyDesc: "ప్రశ్నను టైప్ చేయండి, త్వరిత సూచనను ఎంచుకోండి లేదా ఆడియో పంపడానికి మైక్రోఫోన్ బటన్‌ను నొక్కి పట్టుకోండి.",
    inputPlaceholder: "సమస్యను టైప్ చేయండి, ఉదా: వీధిలైట్ పాడైంది...",
    recordingLabel: "మాట్లాడటానికి నొక్కి పట్టుకోండి / లైవ్ ఆడియో రికార్డ్ అవుతోంది",
    recordingCancel: "రద్దు చేయి",
    regenerateLabel: "సమాధానాన్ని తిరిగి రూపొందించు",
    activeContextHeading: "సక్రియ సమస్య సందర్భం",
    hideContext: "సందర్భాన్ని దాచు",
    loadSimulation: "సిమ్యులేషన్ లోడ్ చేయి",
    queryStatus: "స్థితి విచారణ",
    openLiveMap: "లైవ్ మ్యాప్ తెరవండి",
    dialogHeading: "స్మార్ట్ సంభాషణల సినారియోలు",
    actionsHeading: "త్వరిత చర్యల మాడ్యూల్స్",
    defaultReply: "ఈ విషయాన్ని మా దృష్టికి తీసుకువచ్చినందుకు ధన్యవాదాలు. వర్గం, కోఆర్డినేట్లు మరియు తగిన విభాగాన్ని గుర్తించడానికి నేను ఈ వివరాలను మా మునిసిపల్ విశ్లేషణ వ్యవస్థకు పంపుతాను.",
    voiceInputTrigger: "వాయిస్ ఇన్‌పుట్: ఇందిరానగర్ రోడ్డులో వీధిలైట్ పాడైంది",
    attachmentAlert: "సాక్ష్యపు ఫోటో విజయవంతంగా అప్‌లోడ్ చేయబడింది.",
    attachedText: "సాక్ష్యపు ఫోటో జతచేయబడింది",
    chips: [
      { text: '📷 సమస్యను నివేదించండి', key: 'report an issue' },
      { text: '📍 ఫిర్యాదును ట్రాక్ చేయండి', key: 'track complaint' },
      { text: '📊 సమీప సమస్యలు', key: 'nearby issues' },
      { text: '🏛 వార్డు పనితీరు', key: 'ward performance' },
      { text: '🌧 వరద అంచనా', key: 'flood prediction' },
      { text: '🚰 నీటి లీకేజీ', key: 'water leakage' },
      { text: '💡 వీధిలైట్ సమస్య', key: 'streetlight issue' }
    ],
    dialogs: [
      { q: "మా ఇంటి దగ్గర రోడ్డు గుంత ఉంది.", r: "దీనిని నివేదించడంలో నేను మీకు సహాయం చేయగలను. మీరు ఫోటో అప్‌లోడ్ చేయాలనుకుంటున్నారా?" },
      { q: "సమీప సమస్యలను చూపించండి.", r: "నేను 1 కిమీ పరిధిలో 8 సక్రియ సమస్యలను కనుగొన్నాను." },
      { q: "నా ఫిర్యాదు ఎందుకు ఆలస్యమవుతోంది?", r: "మీ ఫిర్యాదు ప్రస్తుతం కమ్యూనిటీ ధృవీకరణ కోసం వేచి ఉంది." }
    ],
    actions: [
      { label: 'సమస్య నివేదిక', route: '#report-issue', icon: '📝' },
      { label: 'ఫిర్యాదు ట్రాక్', route: '#citizen-dashboard', icon: '🔍' },
      { label: 'సమీప సమస్యలు', route: '#live-map', icon: '📍' },
      { label: 'కమ్యూనిటీ ధృవీకరణ', route: '#transparency', icon: '🤝' },
      { label: 'అత్యవసర సంప్రదింపులు', route: '#how-it-works', icon: '📞' },
      { label: 'వార్డు డ్యాష్‌బోర్డ్', route: '#transparency', icon: '📊' }
    ],
    autoReplies: {
      'report an issue': "పౌర సమస్యను నివేదించడంలో నేను మీకు సహాయం చేయగలను. మీరు మొదట ఫోటోను అప్‌లోడ్ చేయాలనుకుంటున్నారా? సమస్యను వివరిస్తే చాలు, నేను స్వయంచాలకంగా వర్గం, తీవ్రత మరియు విభాగాన్ని గుర్తిస్తాను.",
      'track complaint': "తప్పకుండా! దయచేసి మీ ఫిర్యాదు ఐడి (ఉదా. CQ-3948) నమోదు చేయండి లేదా 'నా ఫిర్యాదు ఎందుకు ఆలస్యమవుతోంది?' అని అడగండి. మా పారదర్శక డేటాబేస్ లో దాని ప్రస్తుత స్థితిని నేను వెంటనే ట్రాక్ చేస్తాను.",
      'nearby issues': "నేను భౌగోళిక కోఆర్డినేట్లను స్కాన్ చేసాను. మీ స్థానానికి 1 కిమీ పరిధిలో 8 సక్రియ నివేదికలను కనుగొన్నాను, ఇవి ప్రధానంగా 'వీధి దీపాలు' మరియు 'రోడ్డు గుంతలు' కింద వర్గీకరించబడ్డాయి.",
      'ward performance': "స్థానిక రికార్డుల విశ్లేషణ... వార్డు 12 (ఇందిరానగర్) ప్రస్తుతం 96.2% గరిష్ట పరిష్కార సామర్థ్య రేటును కలిగి ఉంది, ఆ తర్వాత వార్డు 84 (మల్లేశ్వరం) 94.5% తో ఉంది.",
      'flood prediction': "వరద అంచనా నమూనా నడుస్తోంది... వచ్చే వారానికి 70 మిమీ వర్షపాతం అంచనా ఆధారంగా, సెక్టార్ 4 (కోరమంగళ) లో వరద వచ్చే ప్రమాదం ఎక్కువగా ఉంది. తక్షణ పూడికతీత సిఫార్సు చేయబడింది.",
      'water leakage': "నీటి లీకేజీ హెచ్చరిక నమోదు చేయబడింది. స్థానిక లైన్లలో నీటి పీడన పడిపోవడాన్ని నేను సరిచూస్తాను మరియు BWSSB నిర్వహణ విభాగానికి రిపేరు ఆదేశాన్ని పంపుతాను.",
      'streetlight issue': "వీధిలైట్ల గ్రిడ్ మ్యాప్ చేయబడింది. వీధిలైట్లు పనిచేయకపోవడం భద్రతకు ముప్పు కలిగించవచ్చు. నేను స్థానిక విద్యుత్ బోర్డు (BESCOM) కు 24 గంటల SLA తో స్వయంచాలక తనిఖీ ఆదేశాన్ని పంపాను.",
      'మా ఇంటి దగ్గర రోడ్డు గుంత ఉంది.': "దీనిని నివేదించడంలో నేను మీకు సహాయం చేయగలను. మీరు ఫోటో అప్‌లోడ్ చేయాలనుకుంటున్నారా?",
      'సమీప సమస్యలను చూపించండి.': "నేను 1 కిమీ పరిధిలో 8 సక్రియ సమస్యలను కనుగొన్నాను.",
      'నా ఫిర్యాదు ఎందుకు ఆలస్యమవుతోంది?': "మీ ఫిర్యాదు ప్రస్తుతం కమ్యూనిటీ ధృవీకరణ కోసం వేచి ఉంది."
    },
    capabilitiesTitle: "ప్రధాన నమూనాలు",
    capabilitiesSubtitle: "CivicQ డీప్ లెర్నింగ్ పైప్‌లైన్",
    capabilitiesDesc: "మున్సిపల్ పని వేగాన్ని పెంచడానికి మా ప్రత్యేక ఇంటెలిజెన్స్ లేయర్ అన్‌స్ట్రక్చర్డ్ ఇమేజ్ మరియు టెక్స్ట్ పేలోడ్‌లను ప్రాసెస్ చేస్తుంది.",
    capabilities: [
      { title: 'చిత్రాల విశ్లేషణ', desc: 'ఖచ్చితమైన ఆస్తి వైఫల్య లక్షణాలను (రోడ్డు గుంత లోతు లేదా పైపు లీకేజీ రకం వంటివి) గుర్తించడానికి యూజర్ అప్‌లోడ్‌లను విశ్లేషిస్తుంది.', icon: '👁️' },
      { title: 'సమస్యల వర్గీకరణ', desc: 'పౌరుల వాడుక భాషను అధికారిక వార్డు నిబంధనలకు అనుగుణంగా మున్సిపల్ విభాగాలుగా మారుస్తుంది.', icon: '🏷️' },
      { title: 'తీవ్రత గుర్తింపు', desc: 'అధికారిక రికార్డులలో ప్రాధాన్యతను డైనమిక్‌గా సర్దుబాటు చేయడానికి ప్రజా రక్షణ సూచికలను అంచనా వేస్తుంది.', icon: '⚠️' },
      { title: 'నకిలీల గుర్తింపు', desc: 'ఒకే వీధి సమస్యను వివరించే సమీపంలోని బహుళ నివేదికలను ఒకే నివేదికగా మారుస్తుంది.', icon: '📂' },
      { title: 'అంచనా సమాచారం', desc: 'డ్రైనేజీ సమస్యలను లేదా రహదారి దెబ్బతినడాన్ని ముందుగా అంచనా వేయడానికి భౌగోళిక చారిత్రక రికార్డులను తనిఖీ చేస్తుంది.', icon: '📈' },
      { title: 'పరిష్కార ధృవీకరణ', desc: 'పూర్తి మరమ్మత్తు నిరూపణను నిర్ధారించడానికి కంప్యూటర్ విజన్ ద్వారా ఫోటోలను పోల్చి చూస్తుంది.', icon: '✅' }
    ]
  },
  Tamil: {
    subtitle: "உங்கள் புத்திசாலித்தனமான குடிமை உதவியாளர்",
    chatTab: "ஊடாடும் அரட்டை",
    capsTab: "AI திறன்கள்",
    welcomeHeading: "இன்று நான் எவ்வாறு உதவ முடியும்?",
    welcomeDesc: "உள்ளூர் நகராட்சி விதிகள், நீர் அழுத்த வேறுபாடுகள், தெருவிளக்கு பராமரிப்பு பதிவுகள் மற்றும் வெள்ள கணிப்பு வழிமுறைகளில் நான் சிறப்பாக பயிற்சி பெற்றுள்ளேன்.",
    quickSuggestions: "விரைவான பரிந்துரைகள்",
    emptyHeading: "உங்கள் சமூகத்தைப் பற்றி எதையும் கேளுங்கள்.",
    emptyDesc: "ஒரு கேள்வியைத் தட்டச்சு செய்யவும், விரைவான பரிந்துரையைத் தேர்ந்தெடுக்கவும் அல்லது ஆடியோவை அனுப்ப மைக்ரோஃபோன் பொத்தானை அழுத்திப் பிடிக்கவும்.",
    inputPlaceholder: "பிரச்சினையை தட்டச்சு செய்யவும், எ.கா: தெருவிளக்கு பழுதடைந்துள்ளது...",
    recordingLabel: "பேசுவதற்கு அழுத்திப் பிடிக்கவும் / நேரடி ஆடியோ பதிவு செய்யப்படுகிறது",
    recordingCancel: "ரத்துசெய்",
    regenerateLabel: "பதிலை மீண்டும் உருவாக்கு",
    activeContextHeading: "செயலில் உள்ள பிரச்சினை சூழல்",
    hideContext: "சூழலை மறை",
    loadSimulation: "சிமுலேஷன் ஏற்றவும்",
    queryStatus: "நிலை விசாரணை",
    openLiveMap: "நேரடி வரைபடத்தைத் திறக்கவும்",
    dialogHeading: "ஸ்மார்ட் உரையாடல் காட்சிகள்",
    actionsHeading: "விரைவான செயல் தொகுதிகள்",
    defaultReply: "விஷயத்தை எங்கள் கவனத்திற்கு கொண்டு வந்ததற்கு நன்றி. வகை, கோஆர்டினேட்டுகள் மற்றும் பொருத்தமான துறையைக் கண்டறிய இந்த விவரங்களை எங்கள் நகராட்சி பகுப்பாய்வு முறைக்கு அனுப்புவேன்.",
    voiceInputTrigger: "குரல் உள்ளீடு: இந்திரா நகர் சாலையில் தெருவிளக்கு பழுதடைந்துள்ளது",
    attachmentAlert: "சான்று புகைப்படம் வெற்றிகரமாக பதிவேற்றப்பட்டது.",
    attachedText: "சான்று புகைப்படம் இணைக்கப்பட்டுள்ளது",
    chips: [
      { text: '📷 பிரச்சினையைப் புகாரளி', key: 'report an issue' },
      { text: '📍 புகாரைக் கண்காணிக்கவும்', key: 'track complaint' },
      { text: '📊 அருகிலுள்ள பிரச்சினைகள்', key: 'nearby issues' },
      { text: '🏛 வார்டு செயல்திறன்', key: 'ward performance' },
      { text: '🌧 வெள்ளக் கணிப்பு', key: 'flood prediction' },
      { text: '🚰 நீர் கசிவு', key: 'water leakage' },
      { text: '💡 தெருவிளக்கு பிரச்சினை', key: 'streetlight issue' }
    ],
    dialogs: [
      { q: "என் வீட்டிற்கு அருகில் ஒரு பெரிய குழி உள்ளது.", r: "அதைப் புகாரளிக்க நான் உங்களுக்கு உதவ முடியும். நீங்கள் ஒரு புகைப்படத்தைப் பதிவேற்ற விரும்புகிறீர்களா?" },
      { q: "அருகிலுள்ள பிரச்சினைகளைக் காட்டு.", r: "1 கிமீ தூரத்திற்குள் 8 செயலில் உள்ள பிரச்சினைகளைக் கண்டறிந்துள்ளேன்." },
      { q: "எனது புகார் ஏன் தாமதமாகிறது?", r: "உங்கள் புகார் தற்போது சமூக சரிபார்ப்பிற்காக காத்திருக்கிறது." }
    ],
    actions: [
      { label: 'புகாரளிக்கவும்', route: '#report-issue', icon: '📝' },
      { label: 'புகார் கண்காணிப்பு', route: '#citizen-dashboard', icon: '🔍' },
      { label: 'அருகிலுள்ள பிரச்சினைகள்', route: '#live-map', icon: '📍' },
      { label: 'சமூக சரிபார்ப்பு', route: '#transparency', icon: '🤝' },
      { label: 'அவசர தொடர்புகள்', route: '#how-it-works', icon: '📞' },
      { label: 'வார்டு டாஷ்போர்டு', route: '#transparency', icon: '📊' }
    ],
    autoReplies: {
      'report an issue': "குடிமைப் பிரச்சினையைப் புகாரளிக்க நான் உங்களுக்கு உதவ முடியும். முதலில் புகைப்படத்தைப் பதிவேற்ற விரும்புகிறீர்களா? பிரச்சினையை விவரித்தால் போதும், நான் வகை, தீவிரம் மற்றும் துறையைத் தானாகவே கண்டறிவேன்.",
      'track complaint': "நிச்சயமாக! உங்கள் புகார் ஐடியை உள்ளிடவும் (எ.கா. CQ-3948) அல்லது 'எனது புகார் ஏன் தாமதமாகிறது?' என்று கேட்கவும். எங்களது வெளிப்படையான தரவுத்தளத்தில் அதன் தற்போதைய நிலையை நான் உடனடியாகக் கண்காணிப்பேன்.",
      'nearby issues': "நான் புவியியல் ஆயத்தொலைவுகளை ஸ்கேன் செய்துள்ளேன். உங்கள் இருப்பிடத்திலிருந்து 1 கிமீ தூரத்திற்குள் 8 செயலில் உள்ள புகார்களைக் கண்டறிந்துள்ளேன், முக்கியமாக 'தெரு விளக்குகள்' மற்றும் 'சாலைக் குழிகள்' என வகைப்படுத்தப்பட்டுள்ளன.",
      'ward performance': "உள்ளூர் பதிவுகளின் பகுப்பாய்வு... வார்டு 12 (இந்திராநகர்) தற்போது 96.2% அதிகபட்ச தீர்வுத் திறனைக் கொண்டுள்ளது, அதைத் தொடர்ந்து வார்டு 84 (மல்லேஸ்வரம்) 94.5% கொண்டுள்ளது.",
      'flood prediction': "வெள்ள கணிப்பு மாதிரி இயங்குகிறது... அடுத்த வாரத்திற்கான 70 மிமீ மழைப்பொழிவு கணிப்பின் அடிப்படையில், செக்டார் 4 (கோரமங்களா) வெள்ள அபாய எச்சரிக்கையைக் கொண்டுள்ளது. அவசர தூர்வாருதல் பரிந்துரைக்கப்படுகிறது.",
      'water leakage': "நீர் கசிவு எச்சரிக்கை பதிவு செய்யப்பட்டுள்ளது. உள்ளூர் வரிகளில் நீர் அழுத்தம் குறைவதை நான் சரிபார்த்து, BWSSB பராமரிப்பு பிரிவுக்கு பழுதுபார்க்கும் உத்தரவை அனுப்புவேன்.",
      'streetlight issue': "தெருவிளக்குகளின் கட்டமைப்பு வரைபடமாக்கப்பட்டுள்ளது. தெருவிளக்குகள் பழுதடைவது பாதுகாப்பிற்கு அச்சுறுத்தலாக அமையலாம். நான் உள்ளூர் மின்சார வாரியத்திற்கு (BESCOM) 24 மணிநேர SLA உடன் தானியங்கி ஆய்வு உத்தரவை அனுப்பியுள்ளேன்.",
      'என் வீட்டிற்கு அருகில் ஒரு பெரிய குழி உள்ளது.': "அதைப் புகாரளிக்க நான் உங்களுக்கு உதவ முடியும். நீங்கள் ஒரு புகைப்படத்தைப் பதிவேற்ற விரும்புகிறீர்களா?",
      'அருகிலுள்ள பிரச்சினைகளைக் காட்டு.': "1 கிமீ தூரத்திற்குள் 8 செயலில் உள்ள பிரச்சினைகளைக் கண்டறிந்துள்ளேன்.",
      'எனது புகார் ஏன் தாமதமாகிறது?': "உங்கள் புகார் தற்போது சமூக சரிபார்ப்பிற்காக காத்திருக்கிறது."
    },
    capabilitiesTitle: "முக்கிய மாதிரிகள்",
    capabilitiesSubtitle: "CivicQ ஆழ்ந்த கற்றல் தளம்",
    capabilitiesDesc: "நகராட்சி செயல்முறைகளின் நேரத்தைக் குறைக்க எங்களது பிரத்யேக நுண்ணறிவு தளம் படங்களையும் உரை தகவல்களையும் பகுப்பாய்வு செய்கிறது.",
    capabilities: [
      { title: 'படங்களின் புரிதல்', desc: 'துல்லியமான பழுதுபார்ப்பு தன்மைகளை (சாலைக் குழியின் ஆழம் அல்லது குழாயின் விரிசல் போன்றவற்றை) கண்டறிய பயனர் பதிவேற்றங்களை பகுப்பாய்வு செய்கிறது.', icon: '👁️' },
      { title: 'வகைப்பாடு செய்தல்', desc: 'பொதுமக்களின் பேச்சு வழக்கை அதிகாரப்பூர்வ வார்டு விதிகளுக்கு ஏற்ப நகராட்சி பிரிவுகளாக மாற்றுகிறது.', icon: '🏷️' },
      { title: 'தீவிரத்தை கண்டறிதல்', desc: 'அதிகாரப்பூர்வ பதிவுகளில் முன்னுரிமை நிலையை மாற்றுவதற்கு பொது பாதுகாப்பு குறியீடுகளை மதிப்பீடு செய்கிறது.', icon: '⚠️' },
      { title: 'போலி பதிவுகளைத் தவிர்த்தல்', desc: 'ஒரே வீதிப் பிரச்சினையை விவரிக்கும் அருகிலுள்ள பல அறிக்கைகளை ஒரே அறிக்கையாக ஒருங்கிணைக்கிறது.', icon: '📂' },
      { title: 'முன்னறிவிப்பு தகவல்கள்', desc: 'கழிவுநீர் அடைப்பு அல்லது சாலை சேதத்தை முன்னறிவிக்க புவியியல் வரலாற்றுப் பதிவுகள் மற்றும் வானிலை கணிப்புகளைச் சரிபார்க்கிறது.', icon: '📈' },
      { title: 'தீர்வை சரிபார்த்தல்', desc: 'முழுமையான பழுதுபார்ப்பை உறுதி செய்ய கணினி பார்வை மூலம் படங்களை ஒப்பிட்டுப் பார்க்கிறது.', icon: '✅' }
    ]
  },
  Marathi: {
    subtitle: "तुमचा बुद्धिमान नागरी सहाय्यक",
    chatTab: "परस्पर संवादी चॅट",
    capsTab: "AI क्षमता",
    welcomeHeading: "आज मी तुम्हाला कशी मदत करू शकतो?",
    welcomeDesc: "मला विशेषतः स्थानिक नागरी नियम, पाण्याचा दाब विसंगती, पथदिवे देखभाल नोंदी आणि पूर टेलीमेट्री अल्गोरिदमवर प्रशिक्षित केले गेले आहे.",
    quickSuggestions: "त्वरित सुचवणी",
    emptyHeading: "तुमच्या समुदायाबद्दल काहीही विचारा.",
    emptyDesc: "एक प्रश्न टाईप करा, एक द्रुत सुचवणी निवडा किंवा ऑडिओ पाठवण्यासाठी मायक्रोफोन बटण दाबून ठेवा.",
    inputPlaceholder: "समस्या टाईप करा, उदा: पथदिवा बंद आहे...",
    recordingLabel: "बोलण्यासाठी दाबून ठेवा / थेट ऑडिओ रेकॉर्ड होत आहे",
    recordingCancel: "रद्द करा",
    regenerateLabel: "प्रतिक्रिया पुन्हा तयार करा",
    activeContextHeading: "सक्रिय समस्या संदर्भ",
    hideContext: "संदर्भ लपवा",
    loadSimulation: "सिम्युलेशन लोड करा",
    queryStatus: "स्थिती चौकशी",
    openLiveMap: "थेट नकाशा उघडा",
    dialogHeading: "स्मार्ट संवाद परिस्थिती",
    actionsHeading: "त्वरित कृती मॉड्यूल",
    defaultReply: "ही समस्या आमच्या निदर्शनास आणून दिल्याबद्दल धन्यवाद. अचूक वर्गीकरण, स्थान आणि योग्य विभाग निश्चित करण्यासाठी मी ही माहिती आमच्या पालिका विश्लेषण यंत्रणेकडे पाठवीन.",
    voiceInputTrigger: "व्हॉइस इनपुट: इंदिरा नगर रस्त्यावर पथदिवा बंद आहे",
    attachmentAlert: "पुरावा फोटो यशस्वीरित्या अपलोड केला.",
    attachedText: "पुरावा फोटो जोडला",
    chips: [
      { text: '📷 समस्येची नोंद करा', key: 'report an issue' },
      { text: '📍 तक्रार ट्रॅक करा', key: 'track complaint' },
      { text: '📊 जवळील समस्या', key: 'nearby issues' },
      { text: '🏛 वॉर्ड कामगिरी', key: 'ward performance' },
      { text: '🌧 पुराचा अंदाज', key: 'flood prediction' },
      { text: '🚰 पाणी गळती', key: 'water leakage' },
      { text: '💡 पथदिव्याची समस्या', key: 'streetlight issue' }
    ],
    dialogs: [
      { q: "माझ्या घराच्या जवळ एक मोठा खड्डा आहे.", r: "मी तुम्हाला याची नोंद करण्यात मदत करू शकतो. आपण फोटो अपलोड करू इच्छिता?" },
      { q: "जवळील समस्या दाखवा.", r: "मला १ किमीच्या आत ८ सक्रिय समस्या आढळल्या आहेत." },
      { q: "माझ्या तक्रारीला उशीर का होत आहे?", r: "आपली तक्रार सध्या समुदाय पडताळणीसाठी प्रलंबित आहे." }
    ],
    actions: [
      { label: 'समस्येची नोंद', route: '#report-issue', icon: '📝' },
      { label: 'तक्रार ट्रॅक', route: '#citizen-dashboard', icon: '🔍' },
      { label: 'जवळील समस्या', route: '#live-map', icon: '📍' },
      { label: 'समुदाय पडताळणी', route: '#transparency', icon: '🤝' },
      { label: 'आपत्कालीन संपर्क', route: '#how-it-works', icon: '📞' },
      { label: 'वॉर्ड डॅशबोर्ड', route: '#transparency', icon: '📊' }
    ],
    autoReplies: {
      'report an issue': "मी तुम्हाला नागरी समस्येची नोंद करण्यात मदत करू शकतो. आपण प्रथम फोटो अपलोड करू इच्छिता? फक्त समस्येचे वर्णन करा, आणि मी स्वयंचलितपणे श्रेणी, तीव्रता आणि विभाग शोधून काढीन.",
      'track complaint': "नक्कीच! कृपया आपली तक्रार आयडी (उदा. CQ-3948) प्रविष्ट करा किंवा विचारा: 'माझ्या तक्रारीला उशीर का होत आहे?'. मी आमच्या पारदर्शक डेटाबेसवर त्याची सद्यस्थिती त्वरित ट्रॅक करीन.",
      'nearby issues': "मी भौगोलिक गुणक स्कॅन केले आहेत. मला तुमच्या स्थानापासून १ किमीच्या आत ८ सक्रिय अहवाल आढळले आहेत, जे प्रामुख्याने 'पथदिवे' आणि 'रस्त्यावरील खड्डे' अंतर्गत वर्गीकृत आहेत.",
      'ward performance': "स्थानिक नोंदींचे विश्लेषण... वॉर्ड १२ (इंदिरानगर) मध्ये सध्या सर्वात जास्त ९६.२% तक्रार निवारण दर आहे, त्यानंतर वॉर्ड ८४ (मल्लेश्वरम) ९४.५% वर आहे.",
      'flood prediction': "पुराचा अंदाज मॉडेल चालू आहे... पुढील आठवड्यासाठी ७० मिमी पावसाच्या अंदाजावर आधारित, सेक्टर ४ (कोरामंगला) मध्ये पूर येण्याचा धोका जास्त आहे. त्वरित गाळ काढण्याची शिफारस केली जाते.",
      'water leakage': "पाणी गळतीचा इशारा नोंदवला गेला आहे. मी स्थानिक वाहिन्यांमधील पाण्याचा दाब कमी होण्याच्या नोंदींची पडताळणी करेन आणि BWSSB देखभाल विभागाकडे दुरुस्ती आदेश पाठवेन.",
      'streetlight issue': "विद्युत ग्रीड मॅप केला गेला आहे. पथदिवे बंद असणे सुरक्षेसाठी धोकादायक ठरू शकते. मी स्थानिक वीज मंडळाकडे (BESCOM) २४ तासांच्या SLA सह स्वयंचलित तपासणी आदेश पाठवला आहे.",
      'माझ्या घराच्या जवळ एक मोठा खड्डा आहे.': "मी तुम्हाला याची नोंद करण्यात मदत करू शकतो. आपण फोटो अपलोड करू इच्छिता?",
      'जवळील समस्या दाखवा.': "मला १ किमीच्या आत ८ सक्रिय समस्या आढळल्या आहेत.",
      'माझ्या तक्रारीला उशीर का होत आहे?': "आपली तक्रार सध्या समुदाय पडताळणीसाठी प्रलंबित आहे।"
    },
    capabilitiesTitle: "मुख्य मॉडेल",
    capabilitiesSubtitle: "CivicQ डीप लर्निंग प्लॅटफॉर्म",
    capabilitiesDesc: "नगरपालिका कार्य गती वाढवण्यासाठी आमचा विशेष इंटेलिजन्स स्तर असंरचित प्रतिमा आणि मजकूर प्रक्रिया करतो.",
    capabilities: [
      { title: 'प्रतिमेचे आकलन', desc: 'अचूक मालमत्ता बिघाड वैशिष्ट्ये (उदा. रस्त्यावरील खड्ड्याची खोली किंवा पाईप गळतीचा प्रकार) ओळखण्यासाठी वापरकर्त्याने अपलोड केलेल्या फोटोंचे विश्लेषण करते.', icon: '👁️' },
      { title: 'समस्येचे वर्गीकरण', desc: 'नागरिकांच्या बोलचालीच्या भाषेला अधिकृत वॉर्ड नियमांना सुसंगत नागरी विभागांमध्ये बदलते.', icon: '🏷️' },
      { title: 'तीव्रता शोधणे', desc: 'अधिकृत नोंदींमध्ये प्राधान्य क्रम बदलण्यासाठी सार्वजनिक सुरक्षा निर्देशकांचे मूल्यांकन करते.', icon: '⚠️' },
      { title: 'नक्कल तपासणी', desc: 'एकाच रस्त्यावरील समस्येचे वर्णन करणारे जवळपासचे अनेक अहवाल एकत्र करून एकच अहवाल तयार करते.', icon: '📂' },
      { title: 'अंदाज माहिती', desc: 'सांडपाणी समस्या किंवा रस्त्याचे नुकसान आधीच ओळखण्यासाठी भौगोलिक ऐतिहासिक नोंदी आणि हवामान अंदाज तपासते.', icon: '📈' },
      { title: 'निवारण पडताळणी', desc: 'दुरुस्तीची पूर्ण खात्री करण्यासाठी कॉम्प्युटर व्हिजनद्वारे फोटोंची तुलना करते.', icon: '✅' }
    ]
  }
};

export default function CivicAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingPulse, setRecordingPulse] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'capabilities'>('chat');
  
  // Custom states for interactive message reactions
  const [likedMessages, setLikedMessages] = useState<Record<number, boolean>>({});
  const [dislikedMessages, setDislikedMessages] = useState<Record<number, boolean>>({});
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Evidence file attachment state
  const [isAttached, setIsAttached] = useState(false);

  // Simulated active issue context toggle
  const [showActiveContext, setShowActiveContext] = useState(true);

  const [messages, setMessages] = useState<Array<{
    id: number;
    sender: 'user' | 'assistant';
    text: string;
    time: string;
    hasAttachment?: boolean;
  }>>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const languages = ['English', 'Hindi', 'Kannada', 'Tamil', 'Telugu', 'Marathi'];

  // Current translation mappings based on state
  const trans = translations[selectedLanguage] || translations.English;

  // Listen to global open/toggle events
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleToggle = () => setIsOpen(prev => !prev);

    window.addEventListener('open-civic-ai', handleOpen);
    window.addEventListener('toggle-civic-ai', handleToggle);

    return () => {
      window.removeEventListener('open-civic-ai', handleOpen);
      window.removeEventListener('toggle-civic-ai', handleToggle);
    };
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Voice recording pulse timer
  useEffect(() => {
    let interval: any;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingPulse(prev => !prev);
      }, 500);
    } else {
      setRecordingPulse(false);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handleSendMessage = (textToSend: string, presetKey?: string) => {
    const cleanText = textToSend.trim();
    if (!cleanText && !isAttached) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMessage = {
      id: Date.now(),
      sender: 'user' as const,
      text: cleanText || trans.attachedText,
      time: timestamp,
      hasAttachment: isAttached
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsAttached(false);
    setIsTyping(true);

    // Dynamic responses matching user text
    setTimeout(() => {
      const currentTrans = translations[selectedLanguage] || translations.English;
      let replyText = currentTrans.defaultReply;
      
      const lowerText = cleanText.toLowerCase();
      let found = false;

      // 1. Match from explicitly clicked suggestion key
      if (presetKey && currentTrans.autoReplies[presetKey]) {
        replyText = currentTrans.autoReplies[presetKey];
        found = true;
      }

      // 2. Or check keyword in current language autoReplies
      if (!found) {
        for (const key of Object.keys(currentTrans.autoReplies)) {
          if (lowerText.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerText)) {
            replyText = currentTrans.autoReplies[key];
            found = true;
            break;
          }
        }
      }
      
      // 3. Fallback to matching English preset key
      if (!found && selectedLanguage !== 'English') {
        for (const key of Object.keys(translations.English.autoReplies)) {
          if (lowerText.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerText)) {
            replyText = currentTrans.autoReplies[key] || translations.English.autoReplies[key];
            break;
          }
        }
      }

      const botMessage = {
        id: Date.now() + 1,
        sender: 'assistant' as const,
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 1200);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false);
      handleSendMessage(trans.voiceInputTrigger);
    } else {
      setIsRecording(true);
    }
  };

  const regenerateLastMessage = () => {
    if (messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.text);
    }
  };

  return (
    <>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          FLOATING AI BUTTON
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <motion.button
        id="floating-ai-button"
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-tr from-[#14B8A6] to-[#22C55E] rounded-full flex items-center justify-center shadow-xl shadow-[#14B8A6]/20 cursor-pointer border border-[#14B8A6]/30 group"
      >
        <div className="absolute inset-0 rounded-full bg-[#14B8A6] opacity-0 group-hover:opacity-20 animate-ping duration-1000" />
        <Bot className="w-7 h-7 text-white" />
        <span className="absolute -top-1 -right-1 bg-red-500 text-[8px] font-bold px-1.5 py-0.5 rounded-full text-white uppercase tracking-wider font-mono">
          Live AI
        </span>
      </motion.button>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          AI DRAWER / DRAWER SHEET OVERLAY
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop cover */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black z-50 backdrop-blur-sm"
            />

            {/* Slider Drawer Panel */}
            <motion.div
              id="ai-assistant-drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 22, stiffness: 180 }}
              className="fixed top-0 right-0 bottom-0 w-full sm:w-[480px] bg-[#0B1220] border-l border-white/10 shadow-2xl z-50 flex flex-col justify-between overflow-hidden"
            >
              {/* HEADER SECTION */}
              <div className="p-4 bg-[#111827] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#14B8A6]/10 to-[#22C55E]/10 border border-[#14B8A6]/30 flex items-center justify-center text-xl shrink-0">
                    🤖
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-base text-white tracking-tight font-sans">
                        CivicQ AI
                      </span>
                      <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded border border-emerald-500/10 uppercase">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </div>
                    </div>
                    <span className="text-xs text-gray-400 font-sans">
                      {trans.subtitle}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Language selection dropdown UI */}
                  <div className="relative group">
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                      className="appearance-none bg-[#0B1220] border border-white/10 hover:border-[#14B8A6]/30 text-[10px] rounded-lg px-2.5 py-1.5 pr-6 text-gray-300 font-mono focus:outline-none focus:border-[#14B8A6] cursor-pointer"
                    >
                      {languages.map(lang => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* NAVIGATION TABS FOR FEATURES */}
              <div className="px-4 py-2 bg-[#111827]/40 border-b border-white/5 flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'chat'
                      ? 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {trans.chatTab}
                </button>
                <button
                  onClick={() => setActiveTab('capabilities')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    activeTab === 'capabilities'
                      ? 'bg-[#14B8A6]/10 text-[#14B8A6] border border-[#14B8A6]/20'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {trans.capsTab}
                </button>
              </div>

              {/* BODY SECTION */}
              <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-5">
                
                {/* ACTIVE TAB: CHAT INTERFACE */}
                {activeTab === 'chat' && (
                  <>
                    {/* Welcome Header Message */}
                    <div className="bg-[#111827] border border-white/5 rounded-2xl p-4 shadow-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-[#14B8A6]" />
                        <h4 className="text-sm font-bold text-white font-sans">{trans.welcomeHeading}</h4>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed font-sans">
                        {trans.welcomeDesc}
                      </p>
                    </div>

                    {/* Dynamic suggestion chips */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">
                        {trans.quickSuggestions}
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {trans.chips.map((chip) => (
                          <button
                            key={chip.text}
                            onClick={() => handleSendMessage(chip.text, chip.key)}
                            className="bg-white/5 hover:bg-[#14B8A6]/10 border border-white/5 hover:border-[#14B8A6]/30 text-[11px] text-gray-300 hover:text-white px-3 py-1.5 rounded-xl transition-all font-medium cursor-pointer"
                          >
                            {chip.text}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* CHAT MESSAGES PANEL */}
                    <div className="flex flex-col gap-4 border-t border-b border-white/5 py-4 min-h-[220px]">
                      {messages.length === 0 ? (
                        /* Empty State Graphic */
                        <div className="flex-grow flex flex-col items-center justify-center text-center py-10 opacity-70">
                          <div className="w-16 h-16 rounded-full bg-white/3 border border-white/8 flex items-center justify-center text-2xl text-gray-400 mb-3 animate-pulse">
                            🔮
                          </div>
                          <h4 className="text-sm font-bold text-white font-sans">{trans.emptyHeading}</h4>
                          <p className="text-xs text-gray-400 max-w-xs mt-1 font-sans">
                            {trans.emptyDesc}
                          </p>
                        </div>
                      ) : (
                        messages.map((msg, idx) => (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 max-w-[90%] ${
                              msg.sender === 'user' ? 'self-end flex-row-reverse' : 'self-start'
                            }`}
                          >
                            {/* Icon bubble */}
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 text-xs ${
                              msg.sender === 'user' 
                                ? 'bg-gradient-to-tr from-[#22C55E]/10 to-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                                : 'bg-gradient-to-tr from-[#14B8A6]/10 to-blue-500/10 border-[#14B8A6]/20 text-[#14B8A6]'
                            }`}>
                              {msg.sender === 'user' ? '👤' : '🤖'}
                            </div>

                            {/* Message bubble */}
                            <div className="flex flex-col gap-1">
                              <div className={`p-3 rounded-2xl text-xs leading-relaxed relative ${
                                msg.sender === 'user' 
                                  ? 'bg-gradient-to-r from-emerald-500/10 to-[#14B8A6]/10 text-white border border-emerald-500/10 rounded-tr-none' 
                                  : 'bg-[#111827] text-gray-200 border border-white/5 rounded-tl-none shadow-md'
                              }`}>
                                <p className="font-sans whitespace-pre-line">{msg.text}</p>
                                
                                {msg.hasAttachment && (
                                  <div className="mt-2 flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-2 py-1 rounded text-[10px] font-mono">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>{trans.attachmentAlert}</span>
                                  </div>
                                )}

                                {/* Micro controls for Assistant messages */}
                                {msg.sender === 'assistant' && (
                                  <div className="flex items-center gap-2 mt-2 pt-1.5 border-t border-white/3 text-[10px] text-gray-500">
                                    <button 
                                      onClick={() => copyToClipboard(msg.text, idx)}
                                      className="hover:text-white flex items-center gap-1 cursor-pointer"
                                      title="Copy message"
                                    >
                                      <Copy className="w-3 h-3" />
                                      <span>{copiedIndex === idx ? 'Copied' : 'Copy'}</span>
                                    </button>
                                    
                                    <span className="text-gray-700">|</span>

                                    <button 
                                      onClick={() => {
                                        setLikedMessages(prev => ({ ...prev, [msg.id]: !prev[msg.id] }));
                                        setDislikedMessages(prev => ({ ...prev, [msg.id]: false }));
                                      }}
                                      className={`hover:text-emerald-400 flex items-center gap-1 cursor-pointer ${likedMessages[msg.id] ? 'text-emerald-400' : ''}`}
                                    >
                                      <ThumbsUp className="w-3 h-3" />
                                    </button>

                                    <button 
                                      onClick={() => {
                                        setDislikedMessages(prev => ({ ...prev, [msg.id]: !prev[msg.id] }));
                                        setLikedMessages(prev => ({ ...prev, [msg.id]: false }));
                                      }}
                                      className={`hover:text-red-400 flex items-center gap-1 cursor-pointer ${dislikedMessages[msg.id] ? 'text-red-400' : ''}`}
                                    >
                                      <ThumbsDown className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                              <span className="text-[8px] font-mono text-gray-500 px-1">
                                {msg.time}
                              </span>
                            </div>
                          </motion.div>
                        ))
                      )}

                      {/* Animated Typing Indicator */}
                      {isTyping && (
                        <div className="flex gap-3 max-w-[90%] self-start">
                          <div className="w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 text-xs bg-gradient-to-tr from-[#14B8A6]/10 to-blue-500/10 border-[#14B8A6]/20 text-[#14B8A6]">
                            🤖
                          </div>
                          <div className="bg-[#111827] border border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-[#14B8A6] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 bg-[#14B8A6] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 bg-[#14B8A6] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      )}
                      
                      <div ref={messagesEndRef} />
                    </div>

                    {/* SIMULATED OPEN COMPLAINT CONTEXT PANEL */}
                    <div className="bg-[#111827]/40 border border-white/5 rounded-xl p-3.5 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-amber-500" />
                          <span className="text-xs font-bold text-white font-sans">{trans.activeContextHeading}</span>
                        </div>
                        <button
                          onClick={() => setShowActiveContext(!showActiveContext)}
                          className="text-[10px] text-gray-500 hover:text-white font-mono uppercase bg-white/3 px-2 py-0.5 rounded cursor-pointer"
                        >
                          {showActiveContext ? trans.hideContext : trans.loadSimulation}
                        </button>
                      </div>

                      {showActiveContext && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="flex flex-col gap-2 mt-1 text-[11px] text-gray-400 font-sans"
                        >
                          <div className="grid grid-cols-2 gap-2">
                            <div>Issue ID: <span className="text-white font-bold font-mono">CQ-8912</span></div>
                            <div>Current Status: <span className="text-amber-400 font-bold font-mono">Pending Verification</span></div>
                          </div>
                          <div>Location: <span className="text-white">Indiranagar 4th Cross main intersection</span></div>
                          <div>Timeline: <span className="text-white font-mono">SLA breaches in 18 Hrs</span></div>

                          <div className="grid grid-cols-2 gap-2 mt-1 pt-1 border-t border-white/5">
                            <button
                              onClick={() => {
                                handleSendMessage("What is the status of issue CQ-8912?");
                              }}
                              className="bg-white/5 hover:bg-white/10 text-white font-bold py-1.5 rounded text-center cursor-pointer transition-colors"
                            >
                              {trans.queryStatus}
                            </button>
                            <button
                              onClick={() => {
                                setIsOpen(false);
                                window.location.hash = '#live-map';
                              }}
                              className="bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 text-[#14B8A6] font-bold py-1.5 rounded text-center cursor-pointer transition-colors"
                            >
                              {trans.openLiveMap}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </div>

                    {/* SMART CONVERSATIONS EXAMPLES LIST */}
                    <div className="bg-[#111827] border border-white/5 rounded-xl p-3.5 flex flex-col gap-2">
                      <span className="text-[9px] font-mono font-black text-emerald-400 uppercase tracking-widest">
                        {trans.dialogHeading}
                      </span>
                      <div className="flex flex-col gap-2.5">
                        {trans.dialogs.map((conv, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => handleSendMessage(conv.q)}
                            className="p-2 bg-[#0B1220]/60 rounded-lg border border-white/3 hover:border-[#14B8A6]/20 cursor-pointer text-[10px] text-gray-400 hover:text-white transition-all flex flex-col gap-0.5"
                          >
                            <span className="font-bold text-gray-300 font-sans">💬 "{conv.q}"</span>
                            <span className="text-[9px] text-[#14B8A6] mt-0.5 font-sans">↳ AI: "{conv.r}"</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* QUICK ACTION CARDS */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[9px] font-mono font-black text-gray-500 uppercase tracking-widest">
                        {trans.actionsHeading}
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {trans.actions.map((act) => (
                          <button
                            key={act.label}
                            onClick={() => {
                              setIsOpen(false);
                              window.location.hash = act.route;
                            }}
                            className="bg-[#111827]/80 hover:bg-[#14B8A6]/5 border border-white/5 hover:border-[#14B8A6]/20 p-2.5 rounded-xl text-left text-xs text-gray-300 hover:text-white transition-all flex items-center gap-2 cursor-pointer"
                          >
                            <span className="text-sm">{act.icon}</span>
                            <span className="font-medium font-sans">{act.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* ACTIVE TAB: AI CAPABILITIES */}
                {activeTab === 'capabilities' && (
                  <div className="flex flex-col gap-4 font-sans">
                    <div className="flex flex-col">
                      <span className="text-[9px] font-mono font-black text-[#14B8A6] uppercase tracking-widest">
                        {trans.capabilitiesTitle}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        {trans.capabilitiesSubtitle}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {trans.capabilitiesDesc}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 mt-2">
                      {trans.capabilities.map((cap, idx) => (
                        <div
                          key={cap.title}
                          className="bg-[#111827] border border-white/5 p-3 rounded-xl flex items-start gap-3"
                        >
                          <span className="text-xl shrink-0 mt-0.5">{cap.icon}</span>
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold text-white">{cap.title}</span>
                            <span className="text-[11px] text-gray-400 leading-relaxed">{cap.desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* FOOTER BAR: MESSAGE INPUT & MICROPHONE */}
              <div className="p-4 bg-[#111827] border-t border-white/10 flex flex-col gap-3 relative z-10">
                {/* Simulated Speech Record Visual Bubble */}
                <AnimatePresence>
                  {isRecording && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="absolute bottom-20 left-4 right-4 bg-gradient-to-r from-red-500/90 to-amber-500/90 backdrop-blur-md p-3.5 rounded-2xl flex items-center justify-between border border-red-500/20 text-white shadow-2xl"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-3.5 h-3.5 rounded-full bg-white flex items-center justify-center relative`}>
                          <div className={`w-full h-full rounded-full bg-white absolute inset-0 ${recordingPulse ? 'scale-150 opacity-0' : 'scale-100 opacity-100'} transition-all duration-500`} />
                        </div>
                        <span className="text-xs font-mono font-bold uppercase tracking-wider animate-pulse">
                          {trans.recordingLabel}
                        </span>
                      </div>
                      <button 
                        onClick={() => setIsRecording(false)}
                        className="text-[10px] font-mono font-bold bg-white/20 px-2.5 py-1 rounded hover:bg-white/30 cursor-pointer"
                      >
                        {trans.recordingCancel}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center gap-2">
                  {/* Attachment action (UI only, with live feedback) */}
                  <button
                    onClick={() => {
                      setIsAttached(prev => !prev);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                      isAttached
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                        : 'bg-white/5 hover:bg-white/10 border-white/5 text-gray-400 hover:text-white'
                    }`}
                    title="Attach proof file"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Input bar */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputText)}
                    placeholder={trans.inputPlaceholder}
                    className="flex-grow bg-[#0B1220] border border-white/10 focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]/20 text-xs text-white placeholder-gray-500 rounded-xl px-3.5 py-3 focus:outline-none transition-all font-sans"
                  />

                  {/* Microphone */}
                  <button
                    onClick={handleMicClick}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                      isRecording 
                        ? 'bg-red-500/20 border-red-500 text-red-400 animate-pulse'
                        : 'bg-white/5 hover:bg-[#14B8A6]/10 border-white/5 hover:border-[#14B8A6]/30 text-gray-400 hover:text-white'
                    }`}
                    title="Record voice dispatch"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  {/* Send Action */}
                  <button
                    onClick={() => handleSendMessage(inputText)}
                    className="p-3 bg-gradient-to-r from-[#14B8A6] to-[#22C55E] hover:opacity-95 rounded-xl text-white shadow-md transition-all cursor-pointer flex items-center justify-center shrink-0"
                    title="Send query"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[10px] text-gray-500 font-mono">
                  <span>MODEL STATE: <span className="text-[#14B8A6] font-bold">GEMINI FLASH V1.5</span></span>
                  <button 
                    onClick={regenerateLastMessage}
                    className="hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{trans.regenerateLabel}</span>
                  </button>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
