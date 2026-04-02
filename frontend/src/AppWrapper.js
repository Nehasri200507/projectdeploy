import { AuthProvider, useAuth } from './AuthContext';
import App from './App';
import AuthPage from './AuthPage';

function Root() {
  const { user } = useAuth();
  return user ? <App /> : <AuthPage />;
}

export default function AppWrapper() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  );
}
