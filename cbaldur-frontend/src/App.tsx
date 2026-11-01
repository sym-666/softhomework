import { Router, Route } from 'wouter';
import { Provider } from 'react-redux';
import { store } from './redux/store';
import { I18nProvider } from './i18n/I18nProvider';
import { RibbonLayout } from './components/office/RibbonLayout';
import { AuthGuard } from './components/auth/auth-guard';
import { SignIn } from './routes/auth/sign-in';
import { SignUp } from './routes/auth/sign-up';
import { ForgotPassword } from './routes/auth/forgot-password';
import { GithubCallback } from './routes/auth/github-callback';
import { Toaster } from '@/shadcn/components/ui/sonner';
import Home from './routes';
import UserProfile from './routes/user';
import PapersPage from './routes/papers';

const MainApp = () => {
  return (
    <Router>
      <AuthGuard>
        <Route path="/auth/sign-in" component={SignIn} />
        <Route path="/auth/sign-up" component={SignUp} />
        <Route path="/auth/forgot-password" component={ForgotPassword} />
        <Route path="/auth/github/callback" component={GithubCallback} />

        <RibbonLayout>
          <Route path="/" component={Home} />
          <Route path="/user" component={UserProfile} />
          <Route path="/papers" component={PapersPage} />
        </RibbonLayout>
      </AuthGuard>
      <Toaster />
    </Router>
  );
};

const App = () => {
  return (
    <Provider store={store}>
      <I18nProvider>
        <MainApp />
      </I18nProvider>
    </Provider>
  );
};

export default App;
