import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  ShieldCheck, 
  Smartphone, 
  Clock, 
  Menu, 
  X, 
  ChevronRight, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  IndianRupee,
  LogOut,
  LayoutDashboard,
  Users,
  FileText,
  Loader2,
  Camera
} from 'lucide-react';

// --- CONFIGURATION & TYPES ---

/**
 * PRODUCTION SETUP INSTRUCTIONS:
 * 1. Create a project at console.firebase.google.com
 * 2. Enable Auth (Phone), Firestore, and Storage.
 * 3. Copy config to the variable below.
 */

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// --- MOCK SERVICE (Replaces Firebase if keys are missing for Demo) ---

const MOCK_DELAY = 800;

interface User {
  uid: string;
  phoneNumber: string;
  role: 'user' | 'admin';
}

interface LoanApplication {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string;
  panNumber: string;
  aadhaarNumber: string;
  bankAccountName: string;
  monthlyIncome: string;
  status: 'pending' | 'approved' | 'rejected' | 'repaid';
  loanAmount: number;
  repaymentAmount: number;
  createdAt: string; // ISO String
  documents: {
    pan: string;
    aadhaar: string;
    bankStatement: string;
  };
}

// --- APP STATE & CONTEXT ---

type Route = 'home' | 'login' | 'apply' | 'dashboard' | 'repay' | 'admin-login' | 'admin-dashboard';

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  route: Route;
  navigate: (route: Route) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  toast: (msg: string, type?: 'success' | 'error') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- REUSABLE UI COMPONENTS ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: any) => {
  const baseStyle = "px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100";
  const variants = {
    primary: "bg-brand-600 hover:bg-brand-700 text-white shadow-lg shadow-brand-600/20",
    secondary: "bg-slate-800 text-white hover:bg-slate-900",
    outline: "border-2 border-slate-200 hover:border-brand-500 hover:text-brand-600 text-slate-600",
    danger: "bg-red-500 hover:bg-red-600 text-white"
  };
  
  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {disabled ? <Loader2 className="animate-spin w-5 h-5" /> : children}
    </button>
  );
};

const Input = ({ label, type = "text", placeholder, value, onChange, required = false, icon: Icon }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-1.5">{label} {required && <span className="text-red-500">*</span>}</label>
    <div className="relative">
      {Icon && <Icon className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full ${Icon ? 'pl-10' : 'pl-4'} pr-4 py-3 rounded-lg border border-slate-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-200 outline-none transition-all`}
      />
    </div>
  </div>
);

const FileUpload = ({ label, onChange, previewUrl }: any) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>
    <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-brand-500 hover:bg-brand-50 transition-colors relative group">
      <input 
        type="file" 
        onChange={onChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        accept="image/*,.pdf"
      />
      {previewUrl ? (
        <div className="flex flex-col items-center">
          <img src={previewUrl} alt="Preview" className="h-24 w-auto object-cover rounded mb-2 shadow-sm" />
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Uploaded
          </span>
        </div>
      ) : (
        <div className="flex flex-col items-center text-slate-400 group-hover:text-brand-600">
          <Upload className="w-8 h-8 mb-2" />
          <span className="text-sm">Click to upload image/PDF</span>
        </div>
      )}
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-green-100 text-green-800 border-green-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    repaid: "bg-blue-100 text-blue-800 border-blue-200"
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border ${styles[status as keyof typeof styles] || styles.pending}`}>
      {status}
    </span>
  );
};

// --- PAGES ---

// 1. HOME PAGE
const HomePage = () => {
  const { navigate } = useContext(AppContext)!;
  
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Hero */}
      <div className="bg-brand-600 text-white pt-24 pb-32 px-6 rounded-b-[3rem] shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-black opacity-5 rounded-full -ml-10 -mb-10"></div>
        
        <div className="max-w-md mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-brand-500/50 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium mb-6 border border-brand-400">
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
            Instant Approval in 5 mins
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">Need Urgent Cash?</h1>
          <p className="text-brand-100 text-lg mb-8 leading-relaxed">
            Get <span className="font-bold text-white">₹500</span> instantly in your bank account. No complex paperwork. Just basic KYC.
          </p>
          <Button onClick={() => navigate('login')} className="w-full text-lg shadow-xl shadow-brand-900/20 py-4">
            Apply Now <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-md mx-auto px-6 -mt-20 relative z-20">
        <div className="bg-white p-6 rounded-2xl shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
            <div>
              <p className="text-sm text-slate-500">Loan Amount</p>
              <p className="text-2xl font-bold text-slate-900">₹500.00</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Repayment</p>
              <p className="text-2xl font-bold text-slate-900">₹600.00</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg">
            <Clock className="w-4 h-4 text-brand-600" />
            <span>Repay after 30 days</span>
          </div>
        </div>

        <div className="grid gap-4">
          {[
            { icon: ShieldCheck, title: "Secure & Safe", desc: "Your data is encrypted 256-bit." },
            { icon: Smartphone, title: "100% Digital", desc: "No physical visits required." },
            { icon: IndianRupee, title: "Instant Transfer", desc: "Direct to your bank account." },
          ].map((item, i) => (
            <div key={i} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center text-brand-600">
                <item.icon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">{item.title}</h3>
                <p className="text-sm text-slate-500">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 2. AUTH PAGE (Phone Login)
const LoginPage = () => {
  const { navigate, setUser, toast, setIsLoading } = useContext(AppContext)!;
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return toast("Invalid phone number", "error");
    
    setIsLoading(true);
    // Mock API Call
    setTimeout(() => {
      setIsLoading(false);
      setStep('otp');
      toast("OTP Sent: 123456 (Demo)", "success");
    }, MOCK_DELAY);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      setIsLoading(false);
      if (otp === '123456') {
        const mockUser: User = { uid: 'user_' + phone, phoneNumber: phone, role: 'user' };
        localStorage.setItem('shikha_user', JSON.stringify(mockUser));
        setUser(mockUser);
        navigate('dashboard');
        toast("Login Successful", "success");
      } else {
        toast("Invalid OTP", "error");
      }
    }, MOCK_DELAY);
  };

  return (
    <div className="min-h-screen bg-white p-6 pt-24">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-2">Welcome Back</h2>
        <p className="text-slate-500 mb-8">Enter your mobile number to continue</p>
        
        {step === 'phone' ? (
          <form onSubmit={handleSendOtp}>
            <Input 
              label="Mobile Number" 
              placeholder="9876543210" 
              value={phone} 
              onChange={(e: any) => setPhone(e.target.value)}
              required
              icon={Smartphone}
            />
            <Button type="submit" className="w-full">Get OTP</Button>
            <div className="mt-6 text-center">
                <button type="button" onClick={() => navigate('admin-login')} className="text-sm text-slate-400 hover:text-brand-600">Admin Login</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp}>
            <Input 
              label="Enter OTP" 
              placeholder="123456" 
              value={otp} 
              onChange={(e: any) => setOtp(e.target.value)}
              required
              type="number"
            />
            <Button type="submit" className="w-full">Verify & Login</Button>
            <button 
              type="button"
              onClick={() => setStep('phone')} 
              className="w-full mt-4 text-brand-600 font-medium text-sm"
            >
              Change Number
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

// 3. APPLY PAGE
const ApplyPage = () => {
  const { user, navigate, toast, setIsLoading } = useContext(AppContext)!;
  const [formData, setFormData] = useState({
    fullName: '',
    panNumber: '',
    aadhaarNumber: '',
    income: '',
    bankAccountName: ''
  });
  const [files, setFiles] = useState<{ pan: string, aadhaar: string, bank: string }>({ pan: '', aadhaar: '', bank: '' });
  const [agreed, setAgreed] = useState(false);

  const handleFileChange = (field: string) => (e: any) => {
    const file = e.target.files[0];
    if (file) {
      // Create local preview URL for demo
      const url = URL.createObjectURL(file);
      setFiles(prev => ({ ...prev, [field]: url }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return toast("Please accept the terms", "error");
    if (!files.pan || !files.aadhaar || !files.bank) return toast("Please upload all documents", "error");

    setIsLoading(true);

    setTimeout(() => {
      // Create Loan Application
      const application: LoanApplication = {
        id: 'loan_' + Date.now(),
        userId: user!.uid,
        phoneNumber: user!.phoneNumber,
        ...formData,
        status: 'pending',
        loanAmount: 500,
        repaymentAmount: 600,
        createdAt: new Date().toISOString(),
        documents: {
            pan: files.pan,
            aadhaar: files.aadhaar,
            bankStatement: files.bank
        }
      };

      // Save to Mock DB
      const existing = JSON.parse(localStorage.getItem('shikha_loans') || '[]');
      localStorage.setItem('shikha_loans', JSON.stringify([...existing, application]));

      setIsLoading(false);
      toast("Application Submitted!", "success");
      navigate('dashboard');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 pt-24 pb-20">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6">Loan Application</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white p-5 rounded-xl shadow-sm">
            <h3 className="font-semibold mb-4 text-slate-800 border-b pb-2">Personal Details</h3>
            <Input label="Full Name (as per PAN)" value={formData.fullName} onChange={(e:any) => setFormData({...formData, fullName: e.target.value})} required />
            <Input label="PAN Number" value={formData.panNumber} onChange={(e:any) => setFormData({...formData, panNumber: e.target.value.toUpperCase()})} required />
            <Input label="Aadhaar Number" value={formData.aadhaarNumber} onChange={(e:any) => setFormData({...formData, aadhaarNumber: e.target.value})} required type="number" />
            <Input label="Monthly Income" value={formData.income} onChange={(e:any) => setFormData({...formData, income: e.target.value})} required type="number" />
            <Input label="Bank Account Name" value={formData.bankAccountName} onChange={(e:any) => setFormData({...formData, bankAccountName: e.target.value})} required />
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm">
            <h3 className="font-semibold mb-4 text-slate-800 border-b pb-2">Documents</h3>
            <FileUpload label="Upload PAN Card" onChange={handleFileChange('pan')} previewUrl={files.pan} />
            <FileUpload label="Upload Aadhaar Card (Front)" onChange={handleFileChange('aadhaar')} previewUrl={files.aadhaar} />
            <FileUpload label="Upload Bank Statement (Last 3 months)" onChange={handleFileChange('bank')} previewUrl={files.bank} />
          </div>

          <div className="flex items-start gap-3 p-4 bg-brand-50 rounded-lg border border-brand-100">
            <input 
              type="checkbox" 
              id="agree" 
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 text-brand-600 rounded focus:ring-brand-500" 
            />
            <label htmlFor="agree" className="text-sm text-brand-900 leading-snug">
              I agree to the Terms & Conditions and authorize Shikha Loan to verify my documents. I promise to repay ₹600 within 30 days.
            </label>
          </div>

          <Button type="submit" className="w-full py-4 text-lg">Submit Application</Button>
        </form>
      </div>
    </div>
  );
};

// 4. DASHBOARD PAGE
const DashboardPage = () => {
  const { user, navigate } = useContext(AppContext)!;
  const [loan, setLoan] = useState<LoanApplication | null>(null);

  useEffect(() => {
    // Fetch user's loan
    const allLoans: LoanApplication[] = JSON.parse(localStorage.getItem('shikha_loans') || '[]');
    const userLoan = allLoans.find(l => l.userId === user?.uid);
    setLoan(userLoan || null);
  }, [user]);

  if (!loan) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 pt-24 flex flex-col items-center justify-center text-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-sm w-full">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">No Active Loans</h2>
          <p className="text-slate-500 mb-6">You haven't applied for a loan yet.</p>
          <Button onClick={() => navigate('apply')} className="w-full">Apply for ₹500</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 pt-24">
      <div className="max-w-md mx-auto">
        <h2 className="text-2xl font-bold mb-6">My Dashboard</h2>
        
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden mb-6">
          <div className="bg-slate-900 text-white p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-400 text-sm mb-1">Status</p>
                <StatusBadge status={loan.status} />
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm mb-1">Loan ID</p>
                <p className="font-mono text-sm">#{loan.id.slice(-6)}</p>
              </div>
            </div>
            
            <div className="flex justify-between items-end border-t border-slate-700 pt-4 mt-2">
              <div>
                <p className="text-sm text-slate-400">Repayment Amount</p>
                <p className="text-3xl font-bold text-white">₹{loan.repaymentAmount}</p>
              </div>
              {loan.status === 'approved' && (
                 <div className="text-right">
                 <p className="text-xs text-red-400 mb-1">Due Date</p>
                 <p className="font-medium text-white">
                   {new Date(new Date(loan.createdAt).setDate(new Date(loan.createdAt).getDate() + 30)).toLocaleDateString()}
                 </p>
               </div>
              )}
            </div>
          </div>
          
          <div className="p-6">
            {loan.status === 'approved' && (
              <Button onClick={() => navigate('repay')} className="w-full mb-3" variant="primary">
                Repay Now
              </Button>
            )}
            
            <div className="space-y-3 text-sm text-slate-600 mt-4">
              <div className="flex justify-between">
                <span>Applied Date</span>
                <span className="font-medium text-slate-900">{new Date(loan.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Tenure</span>
                <span className="font-medium text-slate-900">30 Days</span>
              </div>
              <div className="flex justify-between">
                <span>Interest Rate</span>
                <span className="font-medium text-slate-900">20% Flat</span>
              </div>
            </div>
          </div>
        </div>

        {loan.status === 'rejected' && (
             <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3 text-red-700 text-sm">
                 <AlertCircle className="w-5 h-5 flex-shrink-0" />
                 <p>Your application was rejected due to document mismatch. Please contact support or re-apply after 7 days.</p>
             </div>
        )}
      </div>
    </div>
  );
};

// 5. REPAYMENT PAGE
const RepaymentPage = () => {
    const { navigate, toast, setIsLoading, user } = useContext(AppContext)!;
    const [file, setFile] = useState<string | null>(null);

    const handleUpload = (e: any) => {
        if(e.target.files[0]) {
            setFile(URL.createObjectURL(e.target.files[0]));
        }
    }

    const handleSubmit = () => {
        if(!file) return toast("Please upload screenshot", "error");
        setIsLoading(true);
        
        setTimeout(() => {
            // In real app, this creates a 'repayment' record
            // For MVP demo, we just notify
            setIsLoading(false);
            toast("Payment submitted for verification", "success");
            navigate('dashboard');
        }, 1500);
    }

    return (
        <div className="min-h-screen bg-slate-50 p-6 pt-24">
            <div className="max-w-md mx-auto">
                <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => navigate('dashboard')}>
                    <ChevronRight className="rotate-180 text-slate-500" />
                    <h2 className="text-2xl font-bold">Repayment</h2>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm text-center mb-6">
                    <p className="text-slate-500 mb-2">Scan & Pay via UPI</p>
                    <div className="w-48 h-48 bg-slate-100 mx-auto rounded-xl flex items-center justify-center mb-4 border-2 border-slate-200">
                        {/* Placeholder for QR Code */}
                        <div className="text-center">
                            <IndianRupee className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                            <span className="text-xs font-mono text-slate-400">UPI ID: shikha@axis</span>
                        </div>
                    </div>
                    <div className="bg-blue-50 text-blue-800 py-2 px-4 rounded-lg inline-block font-mono text-lg font-bold">
                        Pay ₹600
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm">
                    <h3 className="font-semibold mb-4">Upload Payment Proof</h3>
                    <FileUpload label="Screenshot" onChange={handleUpload} previewUrl={file} />
                    <Button onClick={handleSubmit} className="w-full mt-4">Submit Payment</Button>
                </div>
            </div>
        </div>
    )
}

// 6. ADMIN LOGIN
const AdminLoginPage = () => {
    const { navigate, setUser, toast } = useContext(AppContext)!;
    const [secret, setSecret] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if(secret === 'admin123') {
            const adminUser: User = { uid: 'admin_1', phoneNumber: '0000000000', role: 'admin' };
            setUser(adminUser);
            navigate('admin-dashboard');
            toast("Admin Access Granted", "success");
        } else {
            toast("Invalid Credentials", "error");
        }
    }

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
            <div className="bg-white p-8 rounded-2xl w-full max-w-sm">
                <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <ShieldCheck className="text-brand-600" /> Admin Portal
                </h2>
                <form onSubmit={handleLogin}>
                    <Input 
                        label="Admin Password" 
                        type="password"
                        placeholder="Enter secret code" 
                        value={secret} 
                        onChange={(e:any) => setSecret(e.target.value)} 
                    />
                    <Button type="submit" className="w-full">Access Dashboard</Button>
                </form>
                <div className="mt-4 text-center">
                    <span className="text-xs text-slate-400">Demo Password: admin123</span>
                </div>
                <button onClick={() => navigate('home')} className="w-full text-center mt-6 text-sm text-slate-500">Back to App</button>
            </div>
        </div>
    )
}

// 7. ADMIN DASHBOARD
const AdminDashboard = () => {
    const { user, navigate, toast } = useContext(AppContext)!;
    const [loans, setLoans] = useState<LoanApplication[]>([]);
    const [stats, setStats] = useState({ total: 0, active: 0, pending: 0, repaid: 0 });

    useEffect(() => {
        if (user?.role !== 'admin') {
            navigate('admin-login');
            return;
        }
        loadData();
    }, [user]);

    const loadData = () => {
        const data = JSON.parse(localStorage.getItem('shikha_loans') || '[]');
        setLoans(data);
        setStats({
            total: data.length,
            active: data.filter((l: any) => l.status === 'approved').length,
            pending: data.filter((l: any) => l.status === 'pending').length,
            repaid: data.filter((l: any) => l.status === 'repaid').length,
        });
    }

    const updateStatus = (id: string, newStatus: string) => {
        const updated = loans.map(l => l.id === id ? { ...l, status: newStatus } : l);
        localStorage.setItem('shikha_loans', JSON.stringify(updated));
        setLoans(updated as LoanApplication[]); // Cast to satisfy TS
        loadData();
        toast(`Loan marked as ${newStatus}`, "success");
    }

    return (
        <div className="min-h-screen bg-slate-100">
            {/* Admin Header */}
            <div className="bg-white shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-30">
                <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <LayoutDashboard className="text-brand-600" /> Shikha Admin
                </h1>
                <Button variant="secondary" onClick={() => navigate('home')} className="!py-2 !px-3 text-sm">Logout</Button>
            </div>

            <div className="p-6 max-w-6xl mx-auto">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    {[
                        { label: 'Total Apps', val: stats.total, color: 'bg-blue-50 text-blue-600' },
                        { label: 'Pending', val: stats.pending, color: 'bg-yellow-50 text-yellow-600' },
                        { label: 'Active', val: stats.active, color: 'bg-green-50 text-green-600' },
                        { label: 'Repaid', val: stats.repaid, color: 'bg-purple-50 text-purple-600' },
                    ].map((s, i) => (
                        <div key={i} className={`p-4 rounded-xl shadow-sm border border-slate-200 bg-white`}>
                            <p className="text-slate-500 text-xs uppercase font-bold tracking-wider">{s.label}</p>
                            <p className={`text-2xl font-bold mt-1 ${s.color.split(' ')[1]}`}>{s.val}</p>
                        </div>
                    ))}
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">User</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Income</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Documents</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                    <th className="p-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {loans.map((loan) => (
                                    <tr key={loan.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-medium text-slate-900">{loan.fullName}</p>
                                            <p className="text-xs text-slate-500">{loan.phoneNumber}</p>
                                        </td>
                                        <td className="p-4 text-sm">₹{loan.monthlyIncome}</td>
                                        <td className="p-4">
                                            <div className="flex gap-2">
                                                <a href={loan.documents.pan} target="_blank" className="p-1 bg-slate-100 rounded hover:bg-slate-200" title="PAN"><FileText className="w-4 h-4 text-slate-600" /></a>
                                                <a href={loan.documents.aadhaar} target="_blank" className="p-1 bg-slate-100 rounded hover:bg-slate-200" title="Aadhaar"><FileText className="w-4 h-4 text-slate-600" /></a>
                                            </div>
                                        </td>
                                        <td className="p-4"><StatusBadge status={loan.status} /></td>
                                        <td className="p-4">
                                            {loan.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => updateStatus(loan.id, 'approved')} className="bg-green-100 text-green-700 p-2 rounded hover:bg-green-200 font-medium text-xs">Approve</button>
                                                    <button onClick={() => updateStatus(loan.id, 'rejected')} className="bg-red-100 text-red-700 p-2 rounded hover:bg-red-200 font-medium text-xs">Reject</button>
                                                </div>
                                            )}
                                            {loan.status === 'approved' && (
                                                <button onClick={() => updateStatus(loan.id, 'repaid')} className="bg-blue-100 text-blue-700 p-2 rounded hover:bg-blue-200 font-medium text-xs w-full">Mark Paid</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {loans.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-8 text-center text-slate-400">No applications found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- LAYOUT COMPONENTS ---

const Navbar = () => {
  const { navigate, user, setUser } = useContext(AppContext)!;
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('shikha_user');
      navigate('home');
      setMenuOpen(false);
  }

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('home')}>
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold">S</div>
          <span className="font-bold text-xl text-slate-900">Shikha Loan</span>
        </div>

        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 text-slate-600">
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-6">
          {!user ? (
            <Button onClick={() => navigate('login')} variant="primary" className="!py-2 !px-6">Login</Button>
          ) : (
            <>
               <span className="text-sm font-medium text-slate-600">Hi, {user.phoneNumber}</span>
               {user.role === 'admin' ? (
                   <Button onClick={() => navigate('admin-dashboard')} variant="secondary" className="!py-2 !px-4 text-sm">Admin</Button>
               ) : (
                   <Button onClick={() => navigate('dashboard')} variant="outline" className="!py-2 !px-4 text-sm">Dashboard</Button>
               )}
               <button onClick={handleLogout}><LogOut className="w-5 h-5 text-slate-400 hover:text-red-500" /></button>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-slate-100 p-4 shadow-xl md:hidden flex flex-col gap-3">
          {!user ? (
            <Button onClick={() => { navigate('login'); setMenuOpen(false); }} className="w-full">Login / Apply</Button>
          ) : (
            <>
              <Button onClick={() => { navigate('dashboard'); setMenuOpen(false); }} variant="outline" className="w-full">Dashboard</Button>
              <Button onClick={handleLogout} variant="secondary" className="w-full bg-slate-100 text-slate-800">Logout</Button>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

const Toast = ({ message, type, onClose }: { message: string, type: 'success' | 'error', onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium animate-bounce ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {message}
        </div>
    )
}

// --- MAIN APP CONTAINER ---

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [route, setRoute] = useState<Route>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  useEffect(() => {
    // Check local storage for persisted session
    const stored = localStorage.getItem('shikha_user');
    if (stored) {
      setUser(JSON.parse(stored));
      // If user exists, default to dashboard if on home
      if(route === 'home') setRoute('dashboard');
    }
  }, []);

  const navigate = (r: Route) => {
      window.scrollTo(0,0);
      setRoute(r);
  }

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
      setToastMsg({ msg, type });
      setTimeout(() => setToastMsg(null), 3000);
  }

  const renderRoute = () => {
    switch(route) {
      case 'home': return <HomePage />;
      case 'login': return <LoginPage />;
      case 'apply': return <ApplyPage />;
      case 'dashboard': return <DashboardPage />;
      case 'repay': return <RepaymentPage />;
      case 'admin-login': return <AdminLoginPage />;
      case 'admin-dashboard': return <AdminDashboard />;
      default: return <HomePage />;
    }
  };

  return (
    <AppContext.Provider value={{ 
      user, setUser, route, navigate, isLoading, setIsLoading, toast: showToast 
    }}>
      <div className="font-sans text-slate-900 bg-slate-50 min-h-screen relative">
        {route !== 'admin-login' && route !== 'admin-dashboard' && <Navbar />}
        
        {renderRoute()}

        {/* Global Loader Overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[60] flex items-center justify-center">
            <div className="flex flex-col items-center">
              <Loader2 className="w-10 h-10 text-brand-600 animate-spin mb-4" />
              <p className="text-brand-900 font-medium animate-pulse">Processing Securely...</p>
            </div>
          </div>
        )}

        {/* Global Toast */}
        {toastMsg && <Toast message={toastMsg.msg} type={toastMsg.type} onClose={() => setToastMsg(null)} />}
      </div>
    </AppContext.Provider>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
