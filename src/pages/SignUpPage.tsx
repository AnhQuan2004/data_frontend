import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useAuth } from '@/hooks/useAuth';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Mail, Lock, User, Loader2, UserPlus, Check } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

const SignUpPage = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  // Navigate to dashboard when user is authenticated
  useEffect(() => {
    if (user && signupSuccess) {
      navigate('/', { replace: true });
    }
  }, [user, signupSuccess, navigate]);

  const validateUsername = (username: string) => {
    if (!username) {
      setUsernameError('Username is required');
      return false;
    }
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    setUsernameError('');
    return true;
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmPassword: string, password: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setUsername(value);
    if (value) validateUsername(value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    if (value) validateEmail(value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    if (value) validatePassword(value);
    if (confirmPassword) validateConfirmPassword(confirmPassword, value);
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    if (value) validateConfirmPassword(value, password);
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/\d/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const getPasswordStrengthLabel = (strength: number) => {
    switch (strength) {
      case 0:
      case 1:
        return { label: 'Very Weak', color: 'bg-red-500' };
      case 2:
        return { label: 'Weak', color: 'bg-orange-500' };
      case 3:
        return { label: 'Fair', color: 'bg-yellow-500' };
      case 4:
        return { label: 'Good', color: 'bg-blue-500' };
      case 5:
        return { label: 'Strong', color: 'bg-green-500' };
      default:
        return { label: '', color: '' };
    }
  };

  const handleSignUp = async () => {
    setError('');
    
    const isUsernameValid = validateUsername(username);
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword, password);
    
    if (!isUsernameValid || !isEmailValid || !isPasswordValid || !isConfirmPasswordValid) {
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        username: username,
        email: email,
        role: email === 'admin@gfigroup.io' ? 'admin' : 'user',
      });
      
      // Show success toast
      toast({
        title: "Account Created Successfully! 🚀",
        description: `Welcome ${username}! Your account has been created and you're now signed in.`,
        variant: "default",
      });
      
      // Set signup success flag to trigger navigation in useEffect
      setSignupSuccess(true);
      
    } catch (error: any) {
      console.error('Sign up error:', error);
      setError(getErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password is too weak. Please choose a stronger password.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled.';
      default:
        return 'Registration failed. Please try again.';
    }
  };

  const passwordStrength = getPasswordStrength(password);
  const strengthInfo = getPasswordStrengthLabel(passwordStrength);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Modern gradient background */}
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Glass morphism card */}
          <Card className="backdrop-blur-sm bg-white/80 dark:bg-gray-800/80 border-0 shadow-2xl">
            <CardHeader className="space-y-1 text-center pb-8">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Create Account
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                Join us today and get started with your journey
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
                  <AlertDescription className="text-red-800 dark:text-red-200">
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4">
                {/* Username Input */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-medium">
                    Username
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={handleUsernameChange}
                      placeholder="Choose a username"
                      className={`pl-10 transition-all duration-200 ${
                        usernameError 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : username && !usernameError
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                          : 'focus:border-purple-500 focus:ring-purple-500'
                      }`}
                      aria-describedby={usernameError ? "username-error" : undefined}
                    />
                    {username && !usernameError && (
                      <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {usernameError && (
                    <p id="username-error" className="text-sm text-red-600 dark:text-red-400">
                      {usernameError}
                    </p>
                  )}
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={handleEmailChange}
                      placeholder="Enter your email"
                      className={`pl-10 transition-all duration-200 ${
                        emailError 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : email && !emailError
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                          : 'focus:border-purple-500 focus:ring-purple-500'
                      }`}
                      aria-describedby={emailError ? "email-error" : undefined}
                    />
                    {email && !emailError && (
                      <Check className="absolute right-3 top-3 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {emailError && (
                    <p id="email-error" className="text-sm text-red-600 dark:text-red-400">
                      {emailError}
                    </p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={handlePasswordChange}
                      placeholder="Create a password"
                      className={`pl-10 pr-10 transition-all duration-200 ${
                        passwordError 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : password && !passwordError
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                          : 'focus:border-purple-500 focus:ring-purple-500'
                      }`}
                      aria-describedby={passwordError ? "password-error" : "password-strength"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex space-x-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-1 flex-1 rounded-full transition-colors ${
                              level <= passwordStrength ? strengthInfo.color : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Password strength: {strengthInfo.label}
                      </p>
                    </div>
                  )}
                  
                  {passwordError && (
                    <p id="password-error" className="text-sm text-red-600 dark:text-red-400">
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirm Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={handleConfirmPasswordChange}
                      placeholder="Confirm your password"
                      className={`pl-10 pr-10 transition-all duration-200 ${
                        confirmPasswordError 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : confirmPassword && !confirmPasswordError
                          ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                          : 'focus:border-purple-500 focus:ring-purple-500'
                      }`}
                      aria-describedby={confirmPasswordError ? "confirm-password-error" : undefined}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                    {confirmPassword && !confirmPasswordError && (
                      <Check className="absolute right-10 top-3 h-4 w-4 text-green-500" />
                    )}
                  </div>
                  {confirmPasswordError && (
                    <p id="confirm-password-error" className="text-sm text-red-600 dark:text-red-400">
                      {confirmPasswordError}
                    </p>
                  )}
                </div>
              </div>

              {/* Sign Up Button */}
              <Button 
                onClick={handleSignUp} 
                disabled={isLoading || !!usernameError || !!emailError || !!passwordError || !!confirmPasswordError}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>

              {/* Login Link */}
              <div className="text-center">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                      Already have an account?
                    </span>
                  </div>
                </div>

                <Link 
                  to="/login" 
                  className="mt-4 block w-full text-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Sign in to existing account
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;