import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../stores/appStore';
import { RoleToggle } from '../components/RoleToggle';

export function Home() {
  const navigate = useNavigate();
  const { role } = useAppStore();

  const handleStart = () => {
    if (role === 'patient') {
      navigate('/patient');
    } else {
      navigate('/provider');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-sky-500 rounded-2xl flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg">
            🏥
          </div>
          <h1 className="text-3xl font-bold text-slate-800">CareBridge AI</h1>
          <p className="text-slate-600 mt-2">
            Your AI-powered healthcare companion
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4 text-center">
            Select your role
          </h2>

          {/* Role Toggle */}
          <div className="flex justify-center mb-6">
            <RoleToggle />
          </div>

          {/* Description */}
          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            {role === 'patient' ? (
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-800 mb-2">As a Patient:</p>
                <ul className="space-y-1">
                  <li>• Chat with your AI health companion</li>
                  <li>• Track your health timeline</li>
                  <li>• Get personalized recommendations</li>
                </ul>
              </div>
            ) : (
              <div className="text-sm text-slate-600">
                <p className="font-medium text-slate-800 mb-2">As a Provider:</p>
                <ul className="space-y-1">
                  <li>• View patient risk alerts</li>
                  <li>• Access patient timelines</li>
                  <li>• Understand AI decision reasoning</li>
                </ul>
              </div>
            )}
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            className="w-full py-3 bg-sky-500 text-white rounded-xl font-semibold hover:bg-sky-600 transition-colors shadow-lg shadow-sky-500/25"
          >
            Continue as {role === 'patient' ? 'Patient' : 'Provider'}
          </button>
        </div>

        {/* Demo notice */}
        <p className="text-center text-slate-400 text-sm mt-6">
          Demo mode - no login required
        </p>
      </div>
    </div>
  );
}
