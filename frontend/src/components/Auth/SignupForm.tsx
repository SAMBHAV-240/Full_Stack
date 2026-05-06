import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../../store';
import { signup, clearError } from '../../store/slices/authSlice';
import { Button, Input } from '../Common';
import { Mail, Lock, User, Layers, ArrowRight, Eye, EyeOff, CheckCircle2, Zap, Users, BarChart3, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export const SignupForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    try {
      await dispatch(signup({ name, email, password })).unwrap();
      toast.success('Account created successfully!', { icon: '🎉', duration: 3000 });
      navigate('/');
    } catch (err) {
      toast.error(typeof err === 'string' ? err : 'Signup failed');
    }
  };

  const features = [
    { icon: Zap, title: 'Lightning Fast', description: 'Boost productivity with instant task updates' },
    { icon: Users, title: 'Team Collaboration', description: 'Work together seamlessly in real-time' },
    { icon: BarChart3, title: 'Analytics', description: 'Track progress with powerful insights' },
    { icon: Shield, title: 'Secure', description: 'Enterprise-grade security for your data' },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-8px); }
          20%, 40%, 60%, 80% { transform: translateX(8px); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes floatReverse {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(4deg); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes morphBlob {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          25% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          50% { border-radius: 50% 60% 30% 60% / 30% 40% 70% 50%; }
          75% { border-radius: 40% 60% 60% 30% / 60% 30% 50% 60%; }
        }
        @keyframes particleDrift {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0.6; }
          33% { transform: translateY(-30px) translateX(15px) scale(1.1); opacity: 0.9; }
          66% { transform: translateY(-20px) translateX(-10px) scale(0.9); opacity: 0.7; }
          100% { transform: translateY(0) translateX(0) scale(1); opacity: 0.6; }
        }
        @keyframes glowPulse {
          0%, 100% { box-shadow: 0 0 20px rgba(99,102,241,0.4), 0 0 40px rgba(99,102,241,0.1); }
          50% { box-shadow: 0 0 40px rgba(99,102,241,0.7), 0 0 80px rgba(99,102,241,0.3); }
        }
        @keyframes cardEntrance {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes iconBounce {
          0%, 100% { transform: translateY(0); }
          40% { transform: translateY(-6px); }
          60% { transform: translateY(-3px); }
        }

        .animate-fade-in-up { animation: fadeInUp 0.8s ease-out both; }
        .animate-fade-in-left { animation: fadeInLeft 0.8s ease-out both; }
        .animate-fade-in-right { animation: fadeInRight 0.8s ease-out both; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-reverse { animation: floatReverse 7s ease-in-out infinite; }
        .animate-spin-slow { animation: spin-slow 20s linear infinite; }
        .animate-scale-in { animation: scale-in 0.5s ease-out; }
        .animate-morph { animation: morphBlob 10s ease-in-out infinite; }
        .animate-glow-pulse { animation: glowPulse 3s ease-in-out infinite; }
        .animate-card-entrance { animation: cardEntrance 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }

        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }

        .shimmer-text {
          background: linear-gradient(90deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,1) 40%, rgba(255,255,255,0.7) 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        .feature-card {
          transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1);
          position: relative;
          overflow: hidden;
        }
        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.35s ease;
        }
        .feature-card:hover::before { opacity: 1; }
        .feature-card:hover {
          transform: translateY(-4px) scale(1.02);
          background: rgba(255,255,255,0.18) !important;
          border-color: rgba(255,255,255,0.4) !important;
          box-shadow: 0 12px 40px rgba(0,0,0,0.2);
        }
        .feature-card:hover .feature-icon {
          animation: iconBounce 0.6s ease-in-out;
        }

        .particle {
          position: absolute;
          border-radius: 50%;
          pointer-events: none;
        }

        .input-wrapper { transition: all 0.3s ease; }
        .input-wrapper:focus-within { transform: translateY(-1px); }

        .login-card { transition: box-shadow 0.4s ease; }
        .login-card:hover {
          box-shadow: 0 32px 80px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.2);
        }

        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.25); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.45); }
      `}</style>

      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 overflow-hidden relative">

        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Morphing blobs */}
          <div className="absolute top-10 left-10 w-80 h-80 bg-primary-400/25 animate-morph animate-float" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-300/20 animate-morph animate-float" style={{ animationDelay: '3s' }} />
          <div className="absolute top-1/2 left-1/4 w-60 h-60 bg-primary-500/15 animate-morph animate-float-reverse" style={{ animationDelay: '1.5s' }} />

          {/* Grid pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjAzIiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-40" />

          {/* Floating particles */}
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="particle bg-white/20"
              style={{
                width: `${4 + (i % 4) * 3}px`,
                height: `${4 + (i % 4) * 3}px`,
                top: `${10 + (i * 7.5) % 85}%`,
                left: `${5 + (i * 8.3) % 90}%`,
                animation: `particleDrift ${5 + (i % 4)}s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}

          {/* Spinning rings */}
          <div className="absolute -top-40 -left-40 w-80 h-80 border border-primary-300/20 rounded-full animate-spin-slow" />
          <div className="absolute -bottom-40 -right-40 w-80 h-80 border border-primary-300/20 rounded-full animate-spin-slow" style={{ animationDirection: 'reverse', animationDuration: '30s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-white/5 rounded-full animate-spin-slow" style={{ animationDuration: '45s' }} />
        </div>

        {/* Main Container */}
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 relative z-10 h-full flex items-center py-4 sm:py-6 lg:py-8">
          <div className="w-full grid grid-cols-1 lg:grid-cols-[52%_48%] gap-6 lg:gap-12 xl:gap-16 items-center max-h-[95vh]">

            {/* Left Side - Branding & Features */}
            <div className={`text-white space-y-6 lg:space-y-8 hidden lg:block ${mounted ? 'animate-fade-in-left' : 'opacity-0'}`}>
              {/* Logo */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="bg-white/20 backdrop-blur-sm p-3 lg:p-3.5 rounded-2xl shadow-2xl animate-glow-pulse transform transition-all hover:scale-110 hover:rotate-6">
                    <Layers className="w-7 h-7 lg:w-9 lg:h-9 xl:w-10 xl:h-10 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold tracking-tight shimmer-text">TaskCollab</h1>
                    <p className="text-primary-100 text-sm lg:text-base xl:text-lg mt-0.5 lg:mt-1">Collaborate smarter, achieve faster</p>
                  </div>
                </div>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-3 lg:gap-4 mt-6 lg:mt-8">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className={`feature-card bg-white/10 backdrop-blur-md rounded-2xl p-4 lg:p-5 border border-white/20 ${mounted ? 'animate-fade-in-up' : 'opacity-0'}`}
                    style={{ animationDelay: `${0.2 + index * 0.12}s` }}
                  >
                    <feature.icon className="feature-icon w-7 h-7 lg:w-8 lg:h-8 text-white mb-2.5 lg:mb-3" />
                    <h3 className="text-white font-semibold text-sm lg:text-base xl:text-lg mb-1">{feature.title}</h3>
                    <p className="text-primary-100 text-xs lg:text-sm leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Side - Signup Form */}
            <div className={`${mounted ? 'animate-fade-in-right' : 'opacity-0'}`}>
              {/* Mobile-only logo */}
              <div className="lg:hidden text-center mb-6">
                <div className="inline-flex items-center gap-3 mb-3">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-2xl shadow-lg animate-glow-pulse">
                    <Layers className="w-8 h-8 text-white" />
                  </div>
                  <span className="text-3xl font-bold shimmer-text">TaskCollab</span>
                </div>
                <p className="text-white/80 text-sm">Collaborate smarter, achieve faster</p>
              </div>

              <div className="login-card bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-6 lg:p-7 xl:p-8 border border-white/30 animate-card-entrance max-h-[85vh] overflow-y-auto" style={{ animationDelay: '0.15s' }}>
                <div className="text-center mb-5 lg:mb-6">
                  <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-1.5 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                    Create account
                  </h2>
                  <p className="text-xs lg:text-sm text-gray-600 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                    Join thousands of productive teams
                  </p>
                </div>

                {/* Form */}
                <form className="space-y-3 lg:space-y-3.5" onSubmit={handleSubmit}>
                  {error && (
                    <div className="bg-red-50 text-red-700 px-3 py-2.5 rounded-xl text-xs lg:text-sm flex items-start gap-2.5 border border-red-200 animate-shake">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="flex-1">{error}</span>
                    </div>
                  )}

                  <div className="space-y-2.5 lg:space-y-3">
                    {/* Name Input */}
                    <div className="input-wrapper animate-fade-in-up" style={{ animationDelay: '0.45s' }}>
                      <label className="block text-[11px] lg:text-xs font-semibold text-gray-700 mb-1.5">Full name</label>
                      <div className="relative">
                        <Input
                          type="text"
                          placeholder="John Doe"
                          value={name}
                          onChange={(e) => {
                            setName(e.target.value);
                            if (error) dispatch(clearError());
                          }}
                          onFocus={() => setFocusedField('name')}
                          onBlur={() => setFocusedField(null)}
                          required
                          icon={<User className={`w-4 h-4 transition-colors duration-300 ${focusedField === 'name' ? 'text-primary-600' : 'text-gray-400'}`} />}
                          className={`transition-all duration-300 ${focusedField === 'name' ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-100' : ''}`}
                        />
                        {name && (
                          <CheckCircle2 className="w-5 h-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none animate-scale-in" />
                        )}
                      </div>
                    </div>

                    {/* Email Input */}
                    <div className="input-wrapper animate-fade-in-up" style={{ animationDelay: '0.52s' }}>
                      <label className="block text-[11px] lg:text-xs font-semibold text-gray-700 mb-1.5">Email address</label>
                      <div className="relative">
                        <Input
                          type="email"
                          placeholder="you@example.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value);
                            if (error) dispatch(clearError());
                          }}
                          onFocus={() => setFocusedField('email')}
                          onBlur={() => setFocusedField(null)}
                          required
                          icon={<Mail className={`w-4 h-4 transition-colors duration-300 ${focusedField === 'email' ? 'text-primary-600' : 'text-gray-400'}`} />}
                          className={`transition-all duration-300 ${focusedField === 'email' ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-100' : ''}`}
                        />
                        {email && (
                          <CheckCircle2 className="w-5 h-5 text-green-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none animate-scale-in" />
                        )}
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="input-wrapper animate-fade-in-up" style={{ animationDelay: '0.59s' }}>
                      <label className="block text-[11px] lg:text-xs font-semibold text-gray-700 mb-1.5">Password</label>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a strong password"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            if (error) dispatch(clearError());
                          }}
                          onFocus={() => setFocusedField('password')}
                          onBlur={() => setFocusedField(null)}
                          required
                          icon={<Lock className={`w-4 h-4 transition-colors duration-300 ${focusedField === 'password' ? 'text-primary-600' : 'text-gray-400'}`} />}
                          className={`pr-12 transition-all duration-300 ${focusedField === 'password' ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-100' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-300 p-1 rounded-lg hover:bg-gray-100 transform hover:scale-110"
                        >
                          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password Input */}
                    <div className="input-wrapper animate-fade-in-up" style={{ animationDelay: '0.66s' }}>
                      <label className="block text-[11px] lg:text-xs font-semibold text-gray-700 mb-1.5">Confirm password</label>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm your password"
                          value={confirmPassword}
                          onChange={(e) => {
                            setConfirmPassword(e.target.value);
                            if (error) dispatch(clearError());
                          }}
                          onFocus={() => setFocusedField('confirmPassword')}
                          onBlur={() => setFocusedField(null)}
                          required
                          icon={<Lock className={`w-4 h-4 transition-colors duration-300 ${focusedField === 'confirmPassword' ? 'text-primary-600' : 'text-gray-400'}`} />}
                          className={`pr-12 transition-all duration-300 ${focusedField === 'confirmPassword' ? 'ring-2 ring-primary-500 shadow-lg shadow-primary-100' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-all duration-300 p-1 rounded-lg hover:bg-gray-100 transform hover:scale-110"
                        >
                          {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="animate-fade-in-up mt-4 lg:mt-5" style={{ animationDelay: '0.73s' }}>
                    <Button
                      type="submit"
                      className="w-full justify-center group relative overflow-hidden bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-2xl hover:shadow-primary-200 transition-all duration-300 transform hover:-translate-y-1 active:scale-95"
                      isLoading={isLoading}
                    >
                      <span className="relative z-10 flex items-center text-sm lg:text-base">
                        Create account
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-300 group-hover:translate-x-2" />
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-primary-700 to-primary-800 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Button>
                  </div>
                </form>

                {/* Divider */}
                <div className="relative my-4 lg:my-5 animate-fade-in-up" style={{ animationDelay: '0.78s' }}>
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-white text-[11px] lg:text-xs text-gray-500 font-medium">Already have an account?</span>
                  </div>
                </div>

                {/* Sign in link */}
                <div className="animate-fade-in-up" style={{ animationDelay: '0.83s' }}>
                  <Link
                    to="/login"
                    className="block w-full text-center py-2 lg:py-2.5 px-3 border-2 border-gray-300 rounded-xl text-[11px] lg:text-xs font-semibold text-gray-700 hover:border-primary-500 hover:bg-primary-50 hover:text-primary-700 transition-all duration-300 transform hover:-translate-y-1 hover:shadow-md active:scale-95"
                  >
                    Sign in instead
                  </Link>
                </div>
              </div>

              {/* Footer */}
              <div className="text-center mt-4 lg:mt-6 space-y-2 animate-fade-in-up" style={{ animationDelay: '0.9s' }}>
                <p className="text-[10px] lg:text-xs text-white/70">
                  By signing up, you agree to our{' '}
                  <button className="underline hover:text-white transition-colors duration-300">Terms of Service</button>
                  {' '}and{' '}
                  <button className="underline hover:text-white transition-colors duration-300">Privacy Policy</button>
                </p>
                <p className="text-[10px] lg:text-xs text-white/50">
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};