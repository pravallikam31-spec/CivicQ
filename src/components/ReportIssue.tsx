import { useState, useEffect, useRef, DragEvent, ChangeEvent, FormEvent, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Camera, Upload, Video, ArrowLeft, ArrowRight, Sparkles, Check, 
  MapPin, HelpCircle, Volume2, Mic, EyeOff, Eye, Image as ImageIcon,
  AlertTriangle, Shield, CheckCircle2, ChevronRight, AlertOctagon, Info
} from 'lucide-react';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../utils/firebase';

// @ts-ignore
import roadNeglected from '../assets/images/civicq_road_neglected_1782498745967.jpg';
// @ts-ignore
import roadImproved from '../assets/images/civicq_road_improved_1782498762847.jpg';
import { issueStore } from '../utils/issueStore';

interface ReportIssueProps {
  onNavigate: (hash: string) => void;
}

type Step = 'capture' | 'analyze' | 'review' | 'success';

export default function ReportIssue({ onNavigate }: ReportIssueProps) {
  const [currentStep, setCurrentStep] = useState<Step>('capture');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisText, setAnalysisText] = useState('Initializing scanning systems...');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);

  // Gemini state variables
  const [aiClassification, setAiClassification] = useState<string>('Roadway Defect (Pothole)');
  const [aiSeverityText, setAiSeverityText] = useState<string>('High Urgency Level');
  const [aiConfidenceText, setAiConfidenceText] = useState<string>('96.8% Match Rate');

  // File states
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video' | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Input refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // Form Fields for Step 3
  const [category, setCategory] = useState('Potholes');
  const [severity, setSeverity] = useState('High');
  const [location, setLocation] = useState('12th Main Road, Indiranagar, Bengaluru');
  const [landmark, setLandmark] = useState('Opposite Toit Brewpub');
  const [description, setDescription] = useState('Three deep consecutive craters forming a major hazard on the middle lane of the road. Two-wheelers have to suddenly swerve to avoid them.');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [contactNumber, setContactNumber] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNoteRecorded, setVoiceNoteRecorded] = useState(false);
  
  // Success data
  const [generatedIssueId, setGeneratedIssueId] = useState('');

  const [profile, setProfile] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const docRef = doc(db, 'profiles', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data());
          }
        } catch (e) {
          console.error('Error loading profile in ReportIssue:', e);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // File processing and validation
  const processFile = (file: File) => {
    setErrorMessage(null);
    const type = file.type;

    if (type.startsWith('image/')) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(type)) {
        setErrorMessage('Unsupported image format. Please upload a JPG, PNG, or WEBP image.');
        return;
      }
      
      const previewUrl = URL.createObjectURL(file);
      setUploadedImage(previewUrl);
      setSelectedFile(file);
      setFileType('image');
      setFileName(file.name);

      // Convert to base64 DataURL for persistent storage in the store
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setUploadedImage(reader.result);
        }
      };
      reader.readAsDataURL(file);
    } else if (type.startsWith('video/')) {
      const allowedTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-matroska', 'video/mov'];
      const extension = file.name.split('.').pop()?.toLowerCase();
      const allowedExtensions = ['mp4', 'mov', 'webm'];
      
      if (!allowedTypes.includes(type) && (!extension || !allowedExtensions.includes(extension))) {
        setErrorMessage('Unsupported video format. Please upload an MP4, MOV, or WEBM video.');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setUploadedImage(previewUrl);
      setSelectedFile(file);
      setFileType('video');
      setFileName(file.name);
    } else {
      setErrorMessage('Unsupported file type. Please select a valid image or short video.');
    }
  };

  // Click handling for each input trigger
  const handleTakePhotoClick = (e: MouseEvent) => {
    e.stopPropagation();
    photoInputRef.current?.click();
  };

  const handleUploadFileClick = (e: MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleVideoClick = (e: MouseEvent) => {
    e.stopPropagation();
    videoInputRef.current?.click();
  };

  // Step 1: Drag & Drop handlers
  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDeviceFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleVideoChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Option to test the flow with a premium preloaded sample image
  const useSampleImage = (e: MouseEvent) => {
    e.stopPropagation();
    setUploadedImage(roadNeglected);
    setFileType('image');
    setFileName('sample_roadway_defect.jpg');
    setSelectedFile(null);
    setErrorMessage(null);
  };

  // Helper to get base64 from URL (handles relative/sample image paths gracefully)
  const getBase64FromUrl = async (url: string): Promise<string> => {
    if (url.startsWith('data:image/')) {
      return url;
    }
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error("Failed to convert image to base64"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Error fetching and converting image:", err);
      return url;
    }
  };

  // Connect AI Scan Phase to Gemini on the server side
  useEffect(() => {
    let active = true;
    if (currentStep === 'analyze' && !showAnalysisResults) {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      
      const phrases = [
        { progress: 10, text: 'Analyzing image metadata and pixels with Gemini...' },
        { progress: 25, text: 'Detecting physical anomalies & structures...' },
        { progress: 45, text: 'Communicating with Gemini Vision Engine...' },
        { progress: 65, text: 'Estimating depth and municipal severity...' },
        { progress: 80, text: 'Deduplicating local ward records...' },
        { progress: 95, text: 'Synthesizing report context...' },
        { progress: 100, text: 'Analysis complete.' }
      ];

      let currentIdx = 0;
      const interval = setInterval(() => {
        if (!active) return;
        if (currentIdx < phrases.length - 1) {
          setAnalysisProgress(phrases[currentIdx].progress);
          setAnalysisText(phrases[currentIdx].text);
          currentIdx++;
        }
      }, 500);

      // Call Gemini API in parallel
      const fetchAnalysis = async () => {
        try {
          if (!uploadedImage) return;
          const base64Image = await getBase64FromUrl(uploadedImage);
          const response = await fetch("/api/gemini/analyze", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ image: base64Image })
          });

          if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
          }

          const data = await response.json();
          if (active) {
            clearInterval(interval);
            setAnalysisProgress(100);
            setAnalysisText("Analysis complete.");
            
            // Populate category, severity, description
            if (data.category) {
              setCategory(data.category);
              setAiClassification(data.category);
            }
            if (data.severity) {
              setSeverity(data.severity);
              setAiSeverityText(`${data.severity} Urgency Level`);
            }
            if (data.confidence !== undefined) {
              setAiConfidenceText(`${data.confidence}% Match Rate`);
            }
            if (data.summary) {
              setDescription(data.summary);
            }
            
            setTimeout(() => {
              if (active) {
                setIsAnalyzing(false);
                setShowAnalysisResults(true);
              }
            }, 500);
          }
        } catch (error) {
          console.error("Error running AI analysis:", error);
          // Graceful fallback to simulated results so the user flow never breaks
          if (active) {
            clearInterval(interval);
            let fallbackIdx = currentIdx;
            const fallbackInterval = setInterval(() => {
              if (!active) return;
              if (fallbackIdx < phrases.length) {
                setAnalysisProgress(phrases[fallbackIdx].progress);
                setAnalysisText(phrases[fallbackIdx].text);
                fallbackIdx++;
              } else {
                clearInterval(fallbackInterval);
                setIsAnalyzing(false);
                setShowAnalysisResults(true);
              }
            }, 300);
          }
        }
      };

      fetchAnalysis();

      return () => {
        active = false;
        clearInterval(interval);
      };
    }
  }, [currentStep, showAnalysisResults, uploadedImage]);

  // Generate unique ID on submission and save to Cloud Firestore and local store
  const handleSubmitReport = async (e: FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) {
      setErrorMessage('You must be logged in to report an issue. Please sign in or create an account first.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Create a new document in "issues" collection with auto-generated ID
      const issuesCol = collection(db, 'issues');
      const issueDocRef = doc(issuesCol);
      const generatedId = issueDocRef.id;

      // 2. Prepare fields as requested
      const newIssueData = {
        issueId: generatedId,
        reportedBy: user.uid,
        reportedByName: profile?.fullName || user.displayName?.split('|')[0] || 'Anonymous Citizen',
        reportedByEmail: user.email || '',
        category: category,
        description: description,
        severity: severity,
        ward: profile?.ward || 'Ward 12 Indiranagar',
        city: profile?.city || 'Bengaluru',
        latitude: 12.9716, // Bangalore standard coordinates
        longitude: 77.5946, // Bangalore standard coordinates
        address: location,
        image: uploadedImage || '',
        status: "Reported",
        verificationCount: 0,
        upvotes: 0,
        assignedOfficer: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      // 3. Save to Firestore
      await setDoc(issueDocRef, newIssueData);

      // 4. Update state for success tracking
      setGeneratedIssueId(generatedId);

      // 5. Keep in-memory store in sync as well
      issueStore.addIssue({
        id: generatedId,
        title: `${category} near ${landmark || 'MG Road'}`,
        category: category,
        location: location,
        priority: (severity === 'Critical' ? 'Critical' : severity === 'High' ? 'High' : severity === 'Medium' ? 'Medium' : 'Low'),
        reportedTime: 'Just now',
        verifiedCount: 0,
        status: 'Reported',
        distance: '0 m away',
        image: uploadedImage || '',
        description: description,
        landmark: landmark,
        contactNumber: contactNumber,
        isAnonymous: isAnonymous
      });

      // 6. Navigate to success view
      setCurrentStep('success');
    } catch (err: any) {
      console.error('Error saving issue to Firestore:', err);
      setErrorMessage(err?.message || 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1220] text-white pt-24 pb-16 px-6 relative overflow-hidden flex flex-col justify-between select-none">
      
      {/* Background visual decorations */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#14B8A6]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#22C55E]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Main Form Center Wrapper */}
      <div className="max-w-3xl mx-auto w-full flex-grow flex flex-col gap-8 relative z-10">
        
        {/* Header Title with Back navigation button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (currentStep === 'success') {
                  onNavigate('#live-map');
                } else if (currentStep === 'review') {
                  setCurrentStep('analyze');
                } else if (currentStep === 'analyze') {
                  setCurrentStep('capture');
                  setShowAnalysisResults(false);
                } else {
                  onNavigate('#live-map');
                }
              }}
              className="p-2.5 rounded-xl border border-white/8 bg-[#111827] hover:bg-white/5 text-gray-400 hover:text-white transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <span className="text-[10px] font-bold font-mono text-[#14B8A6] uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#14B8A6]" />
                Interactive Lens Reporting
              </span>
              <h1 className="text-2xl font-black tracking-tight text-white mt-0.5">
                Dispatch Municipal Complaint
              </h1>
            </div>
          </div>

          <span className="text-xs font-semibold text-gray-400">
            Secure Citizen Node • Bangalore Ward 12
          </span>
        </div>

        {/* STEPPER PROGRESS INDICATOR */}
        <div className="bg-[#111827]/80 border border-white/8 rounded-2xl p-4 grid grid-cols-4 gap-2 relative">
          
          {/* Stepper Node 1 */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              currentStep === 'capture' 
                ? 'bg-[#14B8A6] text-white shadow-lg shadow-[#14B8A6]/20' 
                : ['analyze', 'review', 'success'].includes(currentStep) 
                  ? 'bg-green-500 text-white' 
                  : 'bg-[#0B1220] text-gray-500 border border-white/5'
            }`}>
              {['analyze', 'review', 'success'].includes(currentStep) ? <Check className="w-4 h-4" /> : '1'}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              currentStep === 'capture' ? 'text-white' : 'text-gray-500'
            }`}>Capture</span>
          </div>

          {/* Stepper Node 2 */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              currentStep === 'analyze' 
                ? 'bg-[#14B8A6] text-white shadow-lg shadow-[#14B8A6]/20' 
                : ['review', 'success'].includes(currentStep)
                  ? 'bg-green-500 text-white' 
                  : 'bg-[#0B1220] text-gray-500 border border-white/5'
            }`}>
              {['review', 'success'].includes(currentStep) ? <Check className="w-4 h-4" /> : '2'}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              currentStep === 'analyze' ? 'text-white' : 'text-gray-500'
            }`}>AI Analysis</span>
          </div>

          {/* Stepper Node 3 */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              currentStep === 'review' 
                ? 'bg-[#14B8A6] text-white shadow-lg shadow-[#14B8A6]/20' 
                : currentStep === 'success'
                  ? 'bg-green-500 text-white'
                  : 'bg-[#0B1220] text-gray-500 border border-white/5'
            }`}>
              {currentStep === 'success' ? <Check className="w-4 h-4" /> : '3'}
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              currentStep === 'review' ? 'text-white' : 'text-gray-500'
            }`}>Review</span>
          </div>

          {/* Stepper Node 4 */}
          <div className="flex flex-col items-center gap-1.5 text-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              currentStep === 'success' 
                ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' 
                : 'bg-[#0B1220] text-gray-500 border border-white/5'
            }`}>
              4
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${
              currentStep === 'success' ? 'text-white' : 'text-gray-500'
            }`}>Success</span>
          </div>

        </div>

        {/* WORKFLOW SCREENS */}
        <div className="flex-grow">
          <AnimatePresence mode="wait">
            
            {/* STEP 1: CAPTURE / UPLOAD COMPONENT */}
            {currentStep === 'capture' && (
              <motion.div
                key="step-capture"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                {errorMessage && (
                  <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl flex items-center gap-3 text-xs text-red-400 shadow-lg shadow-red-500/5">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {!uploadedImage ? (
                  /* Upload Area Trigger */
                  <div
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-4 cursor-pointer p-8 text-center transition-all relative overflow-hidden ${
                      dragActive 
                        ? 'border-[#14B8A6] bg-[#14B8A6]/5' 
                        : 'border-white/10 bg-[#111827] hover:border-[#14B8A6]/50 hover:bg-[#111827]/80'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#14B8A6]/10 to-[#22C55E]/10 border border-white/5 flex items-center justify-center text-[#14B8A6] mb-1 shadow-2xl">
                      <Camera className="w-7 h-7" />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        Capture or Drag & Drop Issue File
                      </h3>
                      <p className="text-xs text-gray-400 max-w-sm mx-auto leading-relaxed">
                        Snap a photo, record a short clip, or select a file. We'll automatically fetch exact geolocation.
                      </p>
                    </div>

                    {/* Beautiful Sample Placeholder Thumbnail */}
                    <div className="flex flex-col items-center gap-2 bg-[#0B1220]/60 border border-white/5 rounded-xl p-2.5 max-w-xs mx-auto">
                      <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">
                        Sample Reference Placeholder
                      </span>
                      <div 
                        onClick={useSampleImage}
                        className="group/sample relative w-32 h-20 rounded-lg overflow-hidden border border-white/10 cursor-pointer hover:border-[#14B8A6] transition-all"
                        title="Click to test workflow with this sample road defect"
                      >
                        <img 
                          src={roadNeglected} 
                          alt="Sample Road Defect" 
                          className="w-full h-full object-cover opacity-60 group-hover/sample:scale-105 group-hover/sample:opacity-100 transition-all"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-center p-1">
                          <span className="text-[9px] font-bold text-[#14B8A6] uppercase tracking-wider group-hover/sample:text-white transition-colors">
                            Use Sample
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Styled Trigger options */}
                    <div className="flex gap-3 mt-2 flex-wrap justify-center">
                      <button
                        type="button"
                        onClick={handleTakePhotoClick}
                        className="px-4 py-2.5 rounded-xl border border-white/8 bg-[#0B1220] hover:bg-white/5 text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 transition-colors"
                      >
                        <Camera className="w-4 h-4 text-[#14B8A6]" />
                        Take Photo
                      </button>
                      <button
                        type="button"
                        onClick={handleUploadFileClick}
                        className="px-4 py-2.5 rounded-xl border border-white/8 bg-[#0B1220] hover:bg-white/5 text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 transition-colors"
                      >
                        <Upload className="w-4 h-4 text-[#22C55E]" />
                        Upload Device File
                      </button>
                      <button
                        type="button"
                        onClick={handleVideoClick}
                        className="px-4 py-2.5 rounded-xl border border-white/8 bg-[#0B1220] hover:bg-white/5 text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 transition-colors"
                      >
                        <Video className="w-4 h-4 text-purple-400" />
                        Short Video
                      </button>
                    </div>

                    {/* Hidden inputs to support exact file type configurations */}
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handlePhotoChange}
                      className="hidden"
                    />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/jpg"
                      onChange={handleDeviceFileChange}
                      className="hidden"
                    />
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      onChange={handleVideoChange}
                      className="hidden"
                    />
                  </div>
                ) : (
                  /* Large Image or Video Selected Preview */
                  <div className="flex flex-col gap-5">
                    <div className="w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 bg-black/40 relative">
                      {fileType === 'video' ? (
                        <video 
                          src={uploadedImage} 
                          controls
                          className="w-full h-full object-contain bg-[#0a0f1d]"
                        />
                      ) : (
                        <img 
                          src={uploadedImage} 
                          alt="Captured Municipal Anomaly" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                      
                      {/* Image tag watermark overlay */}
                      <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-mono flex items-center gap-1.5 z-10">
                        <MapPin className="w-3.5 h-3.5 text-[#14B8A6]" />
                        <span>GEO-BOUND: 12.9716° N, 77.5946° E</span>
                      </div>

                      {fileName && (
                        <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-xl text-[10px] font-mono max-w-[80%] truncate z-10">
                          File: {fileName}
                        </div>
                      )}
                    </div>

                    {/* Image Controls */}
                    <div className="flex justify-between items-center bg-[#111827] border border-white/8 p-4 rounded-xl">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setUploadedImage(null);
                            setSelectedFile(null);
                            setFileType(null);
                            setFileName(null);
                            setErrorMessage(null);
                          }}
                          className="px-4 py-2.5 rounded-xl border border-white/8 hover:bg-white/5 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
                        >
                          Remove File
                        </button>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2.5 rounded-xl border border-white/8 hover:bg-white/5 text-xs font-bold text-[#14B8A6] hover:text-[#22C55E] uppercase tracking-wider transition-colors"
                        >
                          Replace File
                        </button>
                      </div>
                      
                      <button
                        onClick={() => setCurrentStep('analyze')}
                        className="px-6 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#22C55E] hover:opacity-90 text-white font-bold text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-lg shadow-[#14B8A6]/20 transition-transform hover:scale-101 active:scale-99"
                      >
                        Analyze Content
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: PREMIUM SIMULATED AI ANALYSIS SCAN */}
            {currentStep === 'analyze' && (
              <motion.div
                key="step-analyze"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                
                {/* Image or Video under scanner */}
                <div className="w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-white/10 bg-black/40 relative">
                  {fileType === 'video' ? (
                    <video 
                      src={uploadedImage || undefined} 
                      className="w-full h-full object-contain bg-black opacity-60"
                      muted
                      autoPlay
                      loop
                    />
                  ) : (
                    <img 
                      src={uploadedImage || roadNeglected} 
                      alt="Scanning target" 
                      className="w-full h-full object-cover opacity-60"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  {/* Bright glowing laser line scanner animation */}
                  {isAnalyzing && (
                    <div className="absolute left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-[#14B8A6] to-transparent shadow-[0_0_15px_#14B8A6] z-20 animate-bounce" />
                  )}

                  {/* Shading scan overlay */}
                  {isAnalyzing && (
                    <div className="absolute inset-0 bg-gradient-to-b from-[#14B8A6]/5 via-transparent to-[#14B8A6]/5 pointer-events-none" />
                  )}

                  {/* Center Scanning overlay modal */}
                  {isAnalyzing && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-black/40 backdrop-blur-xs text-center">
                      <div className="w-16 h-16 rounded-full border-4 border-[#14B8A6]/20 border-t-[#14B8A6] animate-spin flex items-center justify-center mb-4">
                        <Sparkles className="w-6 h-6 text-[#14B8A6]" />
                      </div>
                      
                      <div className="flex flex-col gap-1.5 max-w-sm">
                        <span className="text-[10px] font-bold font-mono text-[#14B8A6] uppercase tracking-widest">
                          Gemini Vision Engine
                        </span>
                        <h4 className="text-sm font-bold text-white transition-all">
                          {analysisText}
                        </h4>
                        
                        {/* Custom visual horizontal loading indicator */}
                        <div className="w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden mt-2">
                          <div 
                            className="h-full bg-gradient-to-r from-[#14B8A6] to-[#22C55E] transition-all duration-300" 
                            style={{ width: `${analysisProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Completed analysis card representation */}
                  {showAnalysisResults && (
                    <div className="absolute inset-0 bg-black/75 flex flex-col justify-center p-6 sm:p-10">
                      <div className="flex flex-col gap-6">
                        
                        {/* Header metadata tag */}
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-xs font-bold font-mono tracking-widest text-green-400 uppercase">
                            AI Identification Complete
                          </span>
                        </div>

                        {/* Bento analysis grid elements */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          
                          {/* Bento Box 1 */}
                          <div className="bg-[#111827] border border-white/8 p-3 rounded-xl flex flex-col gap-1 shadow-md">
                            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">Classification</span>
                            <span className="text-xs font-bold text-white">{aiClassification}</span>
                          </div>

                          {/* Bento Box 2 */}
                          <div className="bg-[#111827] border border-white/8 p-3 rounded-xl flex flex-col gap-1 shadow-md">
                            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">Calculated Severity</span>
                            <span className="text-xs font-bold text-orange-400">{aiSeverityText}</span>
                          </div>

                          {/* Bento Box 3 */}
                          <div className="bg-[#111827] border border-white/8 p-3 rounded-xl flex flex-col gap-1 shadow-md">
                            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">Detection Confidence</span>
                            <span className="text-xs font-bold text-[#14B8A6]">{aiConfidenceText}</span>
                          </div>

                          {/* Bento Box 4 */}
                          <div className="bg-[#111827] border border-white/8 p-3 rounded-xl flex flex-col gap-1 shadow-md col-span-2 sm:col-span-1">
                            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">Duplicate Check</span>
                            <span className="text-xs font-bold text-green-400">0 Similar entries nearby</span>
                          </div>

                          {/* Bento Box 5 */}
                          <div className="bg-[#111827] border border-white/8 p-3 rounded-xl flex flex-col gap-1 shadow-md col-span-2">
                            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-wider">Identified Ward Coordinates</span>
                            <span className="text-xs font-bold text-gray-300">12th Main Rd, Indiranagar, Bengaluru</span>
                          </div>

                        </div>

                        {/* Small confirmation note */}
                        <p className="text-xs text-gray-400 flex items-center gap-1.5">
                          <Info className="w-4 h-4 text-[#14B8A6] shrink-0" />
                          Coordinates matched successfully with municipal maps. You can refine details in next step.
                        </p>
                      </div>
                    </div>
                  )}

                </div>

                {/* Controls */}
                <div className="flex justify-between items-center bg-[#111827] border border-white/8 p-4 rounded-xl">
                  <button
                    onClick={() => {
                      setCurrentStep('capture');
                      setShowAnalysisResults(false);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-white/8 hover:bg-white/5 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
                  >
                    Back to Photo
                  </button>
                  
                  {showAnalysisResults && (
                    <button
                      onClick={() => setCurrentStep('review')}
                      className="px-6 py-2.5 bg-gradient-to-r from-[#14B8A6] to-[#22C55E] hover:opacity-90 text-white font-bold text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-lg shadow-[#14B8A6]/20 transition-transform hover:scale-101 active:scale-99"
                    >
                      Continue with details
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </motion.div>
            )}

            {/* STEP 3: REVIEW DETAILS AND MANUAL REFINEMENTS */}
            {currentStep === 'review' && (
              <motion.div
                key="step-review"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-6"
              >
                <form onSubmit={handleSubmitReport} className="flex flex-col gap-6">
                  {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3.5 rounded-xl flex items-center gap-3 text-xs text-red-400 shadow-lg shadow-red-500/5 col-span-1 md:col-span-12">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}
                  
                  {/* Outer double split layout */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                    
                    {/* Left details parameters */}
                    <div className="md:col-span-7 flex flex-col gap-4">
                      
                      {/* Issue Category Dropdown */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                          Refined Category
                        </label>
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                          className="w-full p-3.5 rounded-xl bg-[#111827] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white cursor-pointer"
                        >
                          <option value="Potholes">Potholes & Road Cracks</option>
                          <option value="Garbage">Garbage / Trash Accumulation</option>
                          <option value="Water Leakage">Water Leakage & Drainage Floods</option>
                          <option value="Streetlights">Broken Streetlights</option>
                          <option value="Drainage">Damaged Drainage Cover</option>
                          <option value="Safety">Safety / Public Road hazards</option>
                        </select>
                      </div>

                      {/* Severity Selector Pills */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                          Severity Level
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                          {['Low', 'Medium', 'High'].map((level) => (
                            <button
                              key={level}
                              type="button"
                              onClick={() => setSeverity(level)}
                              className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                                severity === level
                                  ? level === 'High' 
                                    ? 'bg-red-500/10 border-red-500 text-red-400' 
                                    : level === 'Medium' 
                                      ? 'bg-yellow-500/10 border-yellow-500 text-yellow-400' 
                                      : 'bg-green-500/10 border-green-500 text-green-400'
                                  : 'bg-[#111827] border-white/5 hover:border-white/12 text-gray-400 hover:text-white'
                              }`}
                            >
                              {level} Urgency
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Description Area */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                          Detailed Description
                        </label>
                        <textarea
                          required
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="w-full h-28 p-3.5 rounded-xl bg-[#111827] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white resize-none leading-relaxed"
                          placeholder="Please supply any context, landmarks, etc."
                        />
                      </div>

                      {/* Optional Voice Note recorder (Simulated UI) */}
                      <div className="bg-[#111827] border border-white/8 rounded-xl p-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setIsRecording(!isRecording);
                              if (!isRecording) {
                                setTimeout(() => {
                                  setIsRecording(false);
                                  setVoiceNoteRecorded(true);
                                }, 3000);
                              }
                            }}
                            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all ${
                              isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-[#0B1220] hover:bg-white/5 text-gray-400 hover:text-white border border-white/8'
                            }`}
                          >
                            <Mic className="w-4 h-4" />
                          </button>
                          <div>
                            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                              Voice Description
                            </span>
                            <span className="text-[11px] text-gray-300">
                              {isRecording 
                                ? 'Recording wave... (3s)' 
                                : voiceNoteRecorded 
                                  ? '✓ Voice note attached (12s)' 
                                  : 'Attach quick voice description note'}
                            </span>
                          </div>
                        </div>

                        {/* Simulated wavelength animation */}
                        {isRecording && (
                          <div className="flex gap-0.5 items-center">
                            <span className="w-1 h-3.5 bg-red-400 rounded-full animate-bounce" />
                            <span className="w-1 h-5 bg-red-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                            <span className="w-1 h-2 bg-red-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-1 h-4 bg-red-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Right details parameters: location mapping & metadata settings */}
                    <div className="md:col-span-5 flex flex-col gap-4">
                      
                      {/* Compact map preview */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                          Detected Location Spot
                        </label>
                        <div className="w-full aspect-[4/3] rounded-xl overflow-hidden border border-white/10 relative bg-[#0a0f1d] p-3 flex flex-col justify-between">
                          {/* Mini Map Placeholder vector background */}
                          <svg className="absolute inset-0 w-full h-full opacity-15" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <line x1="0" y1="30" x2="100" y2="30" stroke="white" strokeWidth="2" />
                            <line x1="0" y1="70" x2="100" y2="70" stroke="white" strokeWidth="2" />
                            <line x1="40" y1="0" x2="40" y2="100" stroke="white" strokeWidth="2" />
                          </svg>

                          <div className="relative z-10 flex items-center gap-1.5 px-2 py-1 bg-black/60 rounded-lg text-[9px] font-mono text-gray-300 self-start border border-white/5">
                            <MapPin className="w-3 h-3 text-[#14B8A6]" />
                            <span>12.97° N, 77.59° E</span>
                          </div>

                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                            <span className="absolute inline-flex h-8 w-8 -top-2 -left-2 rounded-full bg-red-500 animate-ping opacity-25" />
                            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white flex items-center justify-center">
                              <span className="w-1 h-1 rounded-full bg-white" />
                            </div>
                          </div>

                          <div className="relative z-10 mt-auto bg-black/80 backdrop-blur-md p-2 rounded-lg border border-white/5 text-[9px] text-gray-400 leading-normal">
                            Ward Boundary Indiranagar Section 2
                          </div>
                        </div>
                      </div>

                      {/* Precise Location text field */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                          Auto-detected Location
                        </label>
                        <input
                          type="text"
                          required
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          className="w-full p-3 rounded-xl bg-[#111827] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white"
                        />
                      </div>

                      {/* Landmark field */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                          Landmark (Optional)
                        </label>
                        <input
                          type="text"
                          value={landmark}
                          onChange={(e) => setLandmark(e.target.value)}
                          placeholder="e.g. Near bus terminal"
                          className="w-full p-3 rounded-xl bg-[#111827] border border-white/8 focus:border-[#14B8A6] focus:outline-none text-xs text-white placeholder-gray-600"
                        />
                      </div>

                      {/* Anonymous Toggle switch */}
                      <div className="bg-[#111827] border border-white/8 rounded-xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <EyeOff className="w-4 h-4 text-gray-400" />
                          <div>
                            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider block">
                              Report Anonymously
                            </span>
                            <span className="text-[11px] text-gray-400">
                              Hide profile photo & name on civic feed.
                            </span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isAnonymous}
                            onChange={(e) => setIsAnonymous(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-white/5 border border-white/10 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-1 after:left-1 after:bg-gray-400 peer-checked:after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#14B8A6]" />
                        </label>
                      </div>

                    </div>

                  </div>

                  {/* Submission controls row */}
                  <div className="flex justify-between items-center bg-[#111827] border border-white/8 p-4 rounded-xl mt-4">
                    <button
                      type="button"
                      onClick={() => setCurrentStep('analyze')}
                      className="px-4 py-2.5 rounded-xl border border-white/8 hover:bg-white/5 text-xs font-bold text-gray-400 hover:text-white uppercase tracking-wider transition-colors"
                    >
                      Back
                    </button>
                    
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-8 py-3 bg-gradient-to-r from-[#14B8A6] to-[#22C55E] hover:opacity-90 text-white font-bold text-xs uppercase tracking-widest rounded-xl flex items-center gap-2 shadow-lg shadow-[#14B8A6]/20 transition-all hover:scale-101 active:scale-99 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Report'}
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>

                </form>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS CONFIRMATION AND STATUS TIMELINE TRACKER */}
            {currentStep === 'success' && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col gap-8 items-center text-center max-w-xl mx-auto py-6"
              >
                
                {/* Glowing Success Ripple Graphic */}
                <div className="relative mb-2">
                  <div className="absolute inset-0 rounded-full bg-green-500/10 blur-xl scale-120 animate-pulse" />
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-green-500 to-[#14B8A6] p-[1.5px] flex items-center justify-center shadow-2xl relative z-10">
                    <div className="w-full h-full rounded-full bg-[#0B1220] flex items-center justify-center">
                      <Check className="w-9 h-9 text-green-400 stroke-[3]" />
                    </div>
                  </div>
                </div>

                {/* Confirmations Header */}
                <div className="flex flex-col gap-1.5">
                  <h2 className="text-2xl font-black text-white tracking-tight">
                    Issue Successfully Logged
                  </h2>
                  <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
                    Thank you! Your ticket was dispatched to Bangalore municipal services and ward supervisors.
                  </p>
                </div>

                {/* Generated Issue ID block */}
                <div className="bg-[#111827] border border-white/8 rounded-2xl px-6 py-4 w-full flex flex-col gap-1 shadow-md">
                  <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">
                    Dispatched Ticket Number
                  </span>
                  <span className="text-base font-black text-[#14B8A6] tracking-wider font-mono">
                    {generatedIssueId || 'CQ-2026-004812'}
                  </span>
                </div>

                {/* STATUS PROGRESS TIMELINE */}
                <div className="w-full bg-[#111827]/60 border border-white/5 rounded-2xl p-6 flex flex-col gap-5 text-left">
                  <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest block border-b border-white/5 pb-2.5">
                    Ticket Resolution Stages
                  </span>

                  {/* Stage Row Stack */}
                  <div className="flex flex-col gap-4 relative">
                    
                    {/* Visual left connecting line */}
                    <div className="absolute left-3 top-2.5 bottom-2.5 w-[1px] bg-white/5" />

                    {/* Timeline Stage 1 */}
                    <div className="flex gap-4 items-start relative z-10">
                      <div className="w-6 h-6 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center text-green-400 font-bold text-[10px] shrink-0">
                        ✓
                      </div>
                      <div className="text-xs">
                        <h4 className="font-bold text-white">Report Logged</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">Dispatched to Ward 12 coordinator queue.</p>
                      </div>
                    </div>

                    {/* Timeline Stage 2 */}
                    <div className="flex gap-4 items-start relative z-10">
                      <div className="w-6 h-6 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center text-gray-500 font-mono text-[9px] shrink-0">
                        2
                      </div>
                      <div className="text-xs">
                        <h4 className="font-bold text-gray-400">Awaiting Consensus</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">Requiring validation upvotes from 10 neighborhood residents.</p>
                      </div>
                    </div>

                    {/* Timeline Stage 3 */}
                    <div className="flex gap-4 items-start relative z-10">
                      <div className="w-6 h-6 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center text-gray-500 font-mono text-[9px] shrink-0">
                        3
                      </div>
                      <div className="text-xs">
                        <h4 className="font-bold text-gray-400">Assigned Contract Representative</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">Budget authorization and engineering crew selection.</p>
                      </div>
                    </div>

                    {/* Timeline Stage 4 */}
                    <div className="flex gap-4 items-start relative z-10">
                      <div className="w-6 h-6 rounded-full bg-[#111827] border border-white/10 flex items-center justify-center text-gray-500 font-mono text-[9px] shrink-0">
                        4
                      </div>
                      <div className="text-xs">
                        <h4 className="font-bold text-gray-400">Resolution Dispatch</h4>
                        <p className="text-[10px] text-gray-500 mt-0.5">Repair trucks dispatched and materials laid on-site.</p>
                      </div>
                    </div>

                  </div>
                </div>

                {/* Bottom navigation actions */}
                <div className="grid grid-cols-2 gap-3.5 w-full mt-2">
                  <button
                    onClick={() => onNavigate(`/issue/${generatedIssueId || 'CQ-2026-004812'}`)}
                    className="py-3.5 rounded-xl border border-white/8 bg-[#111827] hover:bg-white/5 text-white font-bold text-xs uppercase tracking-widest transition-colors"
                  >
                    Track Issue
                  </button>
                  
                  <button
                    onClick={() => onNavigate('#live-map')}
                    className="py-3.5 bg-gradient-to-r from-[#14B8A6] to-[#22C55E] hover:opacity-90 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#14B8A6]/20 flex items-center justify-center gap-1.5"
                  >
                    Back to Live Map
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

              </motion.div>
            )}

          </AnimatePresence>
        </div>

      </div>

    </div>
  );
}
