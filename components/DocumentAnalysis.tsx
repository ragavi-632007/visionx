import React, { useState, useRef } from "react";
import { analyzeDocument } from "../services/geminiService";
import { documentService } from "../services/supabaseService";
import type { AnalysisResult } from "../types";
import LoadingSpinner from "./LoadingSpinner";
import Disclaimer from "./Disclaimer";
import { useLanguage } from "../i18n/LanguageProvider";
import { isPasswordProtected, convertPdfToImages } from "../utils/pdfPasswordHandler";
import {
  ShieldCheckIcon,
  ExclamationCircleIcon,
  LightbulbIcon,
  BalanceScaleIcon,
  UploadIcon,
  CameraIcon,
  XIcon,
} from "./icons";

const AnalysisSection = ({
  title,
  items,
  icon,
}: {
  title: string;
  items: string[];
  icon: React.ReactNode;
}) => (
  <div className="bg-white dark:bg-slate-800 p-3 sm:p-4 rounded-lg shadow-sm">
    <h3 className="flex items-center text-base sm:text-lg font-semibold text-brand-dark dark:text-white mb-2 sm:mb-3">
      {icon}
      <span className="ml-2">{title}</span>
    </h3>
    <ul className="space-y-1.5 sm:space-y-2">
      {items.map((item, index) => (
        <li key={index} className="flex items-start">
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4 text-brand-secondary mt-1 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            ></path>
          </svg>
          <p className="ml-2 text-gray-700 dark:text-gray-300 text-xs sm:text-sm">
            {item}
          </p>
        </li>
      ))}
    </ul>
  </div>
);

// Small helper: simple heuristics when model doesn't provide fields
const inferIsLegal = (result: AnalysisResult) => {
  if (typeof result.isLegal === "boolean") return result.isLegal;
  const text = [result.summary, ...(result.pros || []), ...(result.cons || [])]
    .join(" ")
    .toLowerCase();
  // look for common legal document keywords
  const keywords = [
    "agreement",
    "contract",
    "nda",
    "non-disclosure",
    "lease",
    "terms",
    "conditions",
    "warranty",
    "agreement between",
    "party",
  ];
  return keywords.some((k) => text.includes(k));
};

const inferAuthenticity = (result: AnalysisResult) => {
  if (result.authenticity) return result.authenticity;
  const text = [
    result.summary,
    ...(result.potentialLoopholes || []),
    ...(result.potentialChallenges || []),
    ...(result.cons || []),
  ]
    .join(" ")
    .toLowerCase();
  // simple heuristics: look for signs of forgery or doubt
  if (/forgery|forged|fake|counterfeit|not authentic|fabricat/i.test(text))
    return "fake";
  if (
    /authentic|original|signed|notarized|registered|executed on|witness/i.test(
      text
    )
  )
    return "real";
  return "unknown";
};

const BadgeLegal = ({ analysis }: { analysis: AnalysisResult }) => {
  const isLegal = inferIsLegal(analysis);
  const { t } = useLanguage();
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
        isLegal
          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
          : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
      }`}
    >
      {isLegal ? (
        <ShieldCheckIcon className="w-4 h-4 mr-2 text-green-600" />
      ) : (
        <ExclamationCircleIcon className="w-4 h-4 mr-2 text-yellow-600" />
      )}
      {isLegal ? t('analysis.badge.legal.true') : t('analysis.badge.legal.false')}
    </span>
  );
};

const BadgeAuthenticity = ({ analysis }: { analysis: AnalysisResult }) => {
  const auth = inferAuthenticity(analysis);
  const { t } = useLanguage();
  const label =
    auth === "real"
      ? t('analysis.badge.auth.real')
      : auth === "fake"
      ? t('analysis.badge.auth.fake')
      : t('analysis.badge.auth.unknown');
  const classes =
    auth === "real"
      ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
      : auth === "fake"
      ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300"
      : "bg-gray-100 text-gray-800 dark:bg-gray-800/20 dark:text-gray-300";
  const Icon =
    auth === "real"
      ? ShieldCheckIcon
      : auth === "fake"
      ? ExclamationCircleIcon
      : LightbulbIcon;
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${classes}`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {label}
    </span>
  );
};

interface DocumentAnalysisProps {
  userId: string;
}

const DocumentAnalysis = ({ userId }: DocumentAnalysisProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [showPasswordPrompt, setShowPasswordPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { t, language, languageNames } = useLanguage();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Camera functionality
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      setShowCamera(true);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions or use file upload instead.');
    }
  };

  // Set video stream when camera modal opens
  React.useEffect(() => {
    if (showCamera && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
        setError('Error starting camera feed. Please try again.');
      });
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [showCamera, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError('Camera not ready. Please wait a moment and try again.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) {
      setError('Unable to capture photo. Please try again.');
      return;
    }

    // Check if video is ready
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      setError('Camera feed not ready. Please wait a moment and try again.');
      return;
    }

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob, then to File
    canvas.toBlob((blob) => {
      if (blob) {
        const fileName = `camera-document-${Date.now()}.jpg`;
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        setSelectedFile(file);
        stopCamera();
        
        // Automatically start analysis after capture
        setTimeout(() => {
          handleAnalyzeWithFile(file);
        }, 100);
      } else {
        setError('Failed to capture photo. Please try again.');
      }
    }, 'image/jpeg', 0.95);
  };

  // Separate analyze function that accepts a file parameter
  const handleAnalyzeWithFile = async (file: File, providedPassword?: string) => {
    if (!file) {
      setError(t('analysis.error.noFile'));
      return;
    }
    
    // Basic validation
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/png',
      'image/jpeg',
      'image/webp'
    ];
    if (!allowedTypes.includes(file.type)) {
      setError('Unsupported file type. Please upload PDF, DOCX, PNG, or JPG.');
      return;
    }
    const maxBytes = 12 * 1024 * 1024; // ~12MB
    if (file.size > maxBytes) {
      setError('File too large. Please upload a file smaller than 12MB.');
      return;
    }
    
    // Check if PDF is password-protected BEFORE attempting analysis
    if (file.type === 'application/pdf' && !providedPassword) {
      try {
        console.log('Checking if PDF is password-protected...');
        setIsLoading(true); // Show loading while checking
        const isProtected = await isPasswordProtected(file);
        console.log('PDF password protection check result:', isProtected);
        if (isProtected) {
          // Show password prompt
          setIsLoading(false);
          setPendingFile(file);
          setShowPasswordPrompt(true);
          setPassword("");
          setPasswordError(null);
          // Focus password input when modal opens
          setTimeout(() => passwordInputRef.current?.focus(), 100);
          return;
        }
        setIsLoading(false); // Reset loading if not protected
      } catch (err) {
        console.error('Error checking PDF password protection:', err);
        setIsLoading(false);
        // Continue with analysis if check fails - might not be password protected
        // But log the error for debugging
      }
    }
    
    setIsLoading(true);
    setError(null);
    setAnalysisResult(null);
    setSaveSuccess(false);
    setShowPasswordPrompt(false);

    try {
      let filesToAnalyze: File | File[] = file;
      
      // If password was provided, convert PDF to images
      if (file.type === 'application/pdf' && providedPassword) {
        try {
          const imageFiles = await convertPdfToImages(file, providedPassword);
          filesToAnalyze = imageFiles;
        } catch (err: any) {
          const errorMessage = err instanceof Error ? err.message : "Failed to decrypt PDF.";
          if (errorMessage.includes('Invalid password') || errorMessage.includes('password')) {
            setPasswordError(errorMessage);
            setShowPasswordPrompt(true);
            setIsLoading(false);
            return;
          }
          throw err;
        }
      }
      
      // Step 1: Analyze document with Gemini
      const result = await analyzeDocument(filesToAnalyze, languageNames[language]);
      setAnalysisResult(result);

      // Step 2: Upload file to Supabase Storage (upload original file, not images)
      const fileUrl = await documentService.uploadFile(file, userId);

      // Step 3: Save document and analysis to database
      await documentService.saveDocument({
        userId,
        fileName: file.name,
        fileType: file.type || "application/octet-stream",
        fileSize: file.size,
        fileUrl,
        summary: result.summary,
        pros: result.pros,
        cons: result.cons,
        potentialLoopholes: result.potentialLoopholes,
        potentialChallenges: result.potentialChallenges,
      });

      setSaveSuccess(true);
      setPassword(""); // Clear password after successful analysis
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      
      // Check if error might be due to password-protected PDF
      // If we haven't checked for password yet and it's a PDF, try checking now
      if (file.type === 'application/pdf' && !providedPassword) {
        try {
          const isProtected = await isPasswordProtected(file);
          if (isProtected) {
            // Show password prompt
            setPendingFile(file);
            setShowPasswordPrompt(true);
            setPassword("");
            setPasswordError(null);
            setIsLoading(false);
            setTimeout(() => passwordInputRef.current?.focus(), 100);
            return;
          }
        } catch (checkErr) {
          console.error('Error checking PDF password protection:', checkErr);
        }
      }
      
      if (!errorMessage.includes('API key') && 
          !errorMessage.includes('Missing API key') && 
          errorMessage !== 'SERVICE_UNAVAILABLE') {
        setError(errorMessage);
      } else {
        console.error('Service unavailable. Please check configuration.');
        setError(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingFile || !password.trim()) {
      setPasswordError('Please enter a password');
      return;
    }
    
    setPasswordError(null);
    await handleAnalyzeWithFile(pendingFile, password.trim());
  };

  const handlePasswordCancel = () => {
    setShowPasswordPrompt(false);
    setPendingFile(null);
    setPassword("");
    setPasswordError(null);
    setIsLoading(false);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError(t('analysis.error.noFile'));
      return;
    }
    await handleAnalyzeWithFile(selectedFile);
  };

  // Cleanup camera stream on unmount
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <div className="p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      <div>
        <label
          htmlFor="document-upload"
          className="block text-base sm:text-lg font-medium text-brand-dark dark:text-gray-200 mb-2"
        >
          {t('analysis.uploadLabel')}
        </label>
        <div className="flex gap-2 sm:gap-3 mb-3">
          <button
            type="button"
            onClick={startCamera}
            disabled={isLoading || showCamera}
            className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-brand-secondary text-white text-xs sm:text-sm md:text-base font-medium rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            <CameraIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Take Photo</span>
            <span className="sm:hidden">Camera</span>
          </button>
        </div>
        <div
          className="flex justify-center items-center w-full px-4 sm:px-6 py-8 sm:py-10 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-slate-800/50 hover:border-brand-secondary dark:hover:border-brand-secondary transition-colors cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center">
            <UploadIcon className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400" />
            <p className="mt-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-brand-secondary">
                {t('analysis.browse')}
              </span>{" "}
              {t('analysis.or')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500">PDF, DOCX, PNG, JPG</p>
            {selectedFile && (
              <p className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-brand-dark dark:text-gray-300 break-all px-2">
                {selectedFile.name}
              </p>
            )}
          </div>
        </div>
        <input
          type="file"
          id="document-upload"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp"
          disabled={isLoading}
        />
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-0 sm:p-2 md:p-4">
          <div className="relative bg-white dark:bg-slate-800 rounded-none sm:rounded-lg p-2 sm:p-4 max-w-4xl w-full h-full sm:h-auto flex flex-col">
            <button
              onClick={stopCamera}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-white dark:bg-slate-800 rounded-full shadow-lg"
            >
              <XIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <div className="mt-8 sm:mt-6 md:mt-8 relative bg-black rounded-lg overflow-hidden flex-1" style={{ minHeight: '250px', maxHeight: 'calc(100vh - 150px)' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-contain"
                style={{ 
                  maxHeight: 'calc(100vh - 150px)',
                  minHeight: '250px',
                  display: 'block',
                  backgroundColor: '#000'
                }}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    videoRef.current.play().catch(console.error);
                  }
                }}
              />
              {!stream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white z-10">
                  <div className="text-center">
                    <CameraIcon className="w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-xs sm:text-sm md:text-base">Starting camera...</p>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
            <div className="mt-3 sm:mt-4 flex justify-center gap-2 sm:gap-3 md:gap-4 pb-3 sm:pb-2 md:pb-0">
              <button
                onClick={capturePhoto}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-brand-secondary text-white text-xs sm:text-sm md:text-base font-bold rounded-lg shadow-md hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-300 transition-all"
              >
                Capture Photo
              </button>
              <button
                onClick={stopCamera}
                className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-500 text-white text-xs sm:text-sm md:text-base font-bold rounded-lg shadow-md hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Prompt Modal */}
      {showPasswordPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
          <div className="relative bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full shadow-xl">
            <button
              onClick={handlePasswordCancel}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XIcon className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-brand-dark dark:text-white mb-4">
              Password Required
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              This PDF is password-protected. Please enter the password to continue.
            </p>
            
            {/* Aadhaar Password Helper */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">
                For eAadhaar PDFs:
              </p>
              <ul className="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                <li>Password is 7-8 characters long</li>
                <li>If name has more than 3 letters: First 4 letters + Year of birth (e.g., ANIS1989)</li>
                <li>If name has 3 letters: First 3 letters + Year of birth (e.g., RIA1989)</li>
              </ul>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-4">
                <label htmlFor="pdf-password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  PDF Password
                </label>
                <input
                  type="password"
                  id="pdf-password"
                  ref={passwordInputRef}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setPasswordError(null);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-secondary focus:border-transparent dark:bg-slate-700 dark:text-white"
                  placeholder="Enter password"
                  disabled={isLoading}
                  autoFocus
                />
                {passwordError && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{passwordError}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading || !password.trim()}
                  className="flex-1 px-4 py-2 bg-brand-secondary text-white font-medium rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  {isLoading ? "Processing..." : "Submit"}
                </button>
                <button
                  type="button"
                  onClick={handlePasswordCancel}
                  disabled={isLoading}
                  className="px-4 py-2 bg-gray-500 text-white font-medium rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          onClick={handleAnalyze}
          disabled={isLoading || !selectedFile}
          className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 bg-brand-secondary text-white text-sm sm:text-base font-bold rounded-lg shadow-md hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-300 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105"
        >
          {isLoading ? "..." : t('analysis.analyze')}
        </button>
      </div>

      {isLoading && <LoadingSpinner />}

      {error && error !== 'SERVICE_UNAVAILABLE' && !error.includes('API key') && (
        <div className="p-4 bg-red-100 text-red-700 border border-red-300 rounded-lg dark:bg-red-900/20 dark:border-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      {saveSuccess && (
        <div className="p-4 bg-green-100 text-green-700 border border-green-300 rounded-lg dark:bg-green-900/20 dark:border-green-700 dark:text-green-300">
          ✓ {t('analysis.savingSuccess')}
        </div>
      )}

      {analysisResult && (
        <div className="space-y-4 sm:space-y-6 animate-fade-in">
          <div className="p-4 sm:p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
            <h2 className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-white mb-3">{t('analysis.section.summary')}</h2>

            {/* Info row: Legal? Authenticity? */}
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">&nbsp;</span>
                <BadgeLegal analysis={analysisResult} />
              </div>

              <div className="flex items-center space-x-2 sm:space-x-3">
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300">&nbsp;</span>
                <BadgeAuthenticity analysis={analysisResult} />
              </div>
            </div>

            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed">
              {analysisResult.summary}
            </p>
            {/* Explicit authenticity section */}
            <div className="mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-slate-900">
              <h3 className="text-lg font-semibold text-brand-dark dark:text-white mb-2">&nbsp;</h3>
              <div className="flex items-center justify-between sm:justify-start sm:gap-6">
                <div className="flex items-center space-x-4">
                  <div className="text-sm">
                    <div className="text-base font-bold">
                      <BadgeAuthenticity analysis={analysisResult} />
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">&nbsp;</div>
                  </div>
                </div>
                <div className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">&nbsp;</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <AnalysisSection
              title={t('analysis.section.pros')}
              items={analysisResult.pros}
              icon={<ShieldCheckIcon className="w-5 h-5 sm:w-6 sm:h-6 text-green-500" />}
            />
            <AnalysisSection
              title={t('analysis.section.cons')}
              items={analysisResult.cons}
              icon={<ExclamationCircleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />}
            />
            <AnalysisSection
              title={t('analysis.section.loopholes')}
              items={analysisResult.potentialLoopholes}
              icon={<LightbulbIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500" />}
            />
            <AnalysisSection
              title={t('analysis.section.challenges')}
              items={analysisResult.potentialChallenges}
              icon={<BalanceScaleIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />}
            />
          </div>

          <Disclaimer />
        </div>
      )}
    </div>
  );
};

export default DocumentAnalysis;
